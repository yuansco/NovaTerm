import {
  CreateSessionPayload,
  LogQuotaConfig,
  SessionCwdEvent,
  SessionDataEvent,
  SessionStatusEvent,
} from '../../shared/types';
import { LogRecorder } from '../logging/LogRecorder';
import { ConfigStore } from '../store/ConfigStore';
import { LocalPtySession, TerminalSessionBackend } from './LocalPtySession';
import { SshSession } from './SshSession';

export interface SessionManagerCallbacks {
  onData: (event: SessionDataEvent) => void;
  onStatus: (event: SessionStatusEvent) => void;
  onCwd: (event: SessionCwdEvent) => void;
}

interface ManagedSession {
  paneId: string;
  backend: TerminalSessionBackend;
  recorder: LogRecorder | null;
  autoCommandTimer?: NodeJS.Timeout;
}

export class SessionManager {
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly configStore: ConfigStore;
  private readonly callbacks: SessionManagerCallbacks;

  constructor(configStore: ConfigStore, callbacks: SessionManagerCallbacks) {
    this.configStore = configStore;
    this.callbacks = callbacks;
  }

  public createSession(payload: CreateSessionPayload): void {
    const { paneId, cols, rows, config } = payload;

    // Close existing session for this paneId if recreated
    if (this.sessions.has(paneId)) {
      void this.closeSession(paneId);
    }

    const appConfig = this.configStore.getConfig();
    let recorder: LogRecorder | null = null;
    if (appConfig.logQuota.enabled) {
      recorder = new LogRecorder(paneId, appConfig.logQuota);
      recorder.start();
    }

    const handleData = (data: string) => {
      const managed = this.sessions.get(paneId);
      if (managed?.recorder) {
        managed.recorder.write(data);
      }
      this.callbacks.onData({ paneId, data });
    };

    if (config.type === 'local') {
      const managed: ManagedSession = {
        paneId,
        backend: null as unknown as TerminalSessionBackend,
        recorder,
      };
      const backend = new LocalPtySession({
        cwd: config.cwd,
        shell: config.shell,
        cols,
        rows,
        onData: handleData,
        onExit: (exitCode) => {
          if (this.sessions.get(paneId) !== managed) {
            return;
          }
          this.callbacks.onStatus({
            paneId,
            status: 'disconnected',
            exitCode,
          });
          void this.cleanupSession(paneId, managed);
        },
      });

      managed.backend = backend;
      this.sessions.set(paneId, managed);
      this.callbacks.onStatus({ paneId, status: 'connected' });

      const autoCmd =
        config.autoCommand?.trim() || appConfig.autoCommands.onNewLocalTab.trim();
      if (autoCmd) {
        this.scheduleAutoCommand(managed, autoCmd, appConfig.autoCommands.delayMs);
      }
      return;
    }

    // SSH Session
    if (!config.sshProfileId) {
      this.callbacks.onStatus({
        paneId,
        status: 'error',
        message: 'Missing SSH profile ID.',
      });
      return;
    }

    const profile = this.configStore.getDecryptedSshProfile(config.sshProfileId);
    if (!profile) {
      this.callbacks.onStatus({
        paneId,
        status: 'error',
        message: `SSH profile "${config.sshProfileId}" not found.`,
      });
      return;
    }

    this.callbacks.onData({
      paneId,
      data: `\r\n\x1b[36m[NovaTerm] Connecting to ${profile.username}@${profile.host}:${profile.port}...\x1b[0m\r\n`,
    });

    const managed: ManagedSession = {
      paneId,
      backend: null as unknown as TerminalSessionBackend,
      recorder,
    };

    const backend = new SshSession({
      profile,
      cols,
      rows,
      onData: handleData,
      onConnected: () => {
        if (this.sessions.get(paneId) !== managed) return;
        this.callbacks.onStatus({ paneId, status: 'connected' });
        const autoCmd =
          config.autoCommand?.trim() ||
          profile.autoCommand?.trim() ||
          appConfig.autoCommands.onNewSshTab.trim();
        if (autoCmd) {
          this.scheduleAutoCommand(managed, autoCmd, appConfig.autoCommands.delayMs);
        }
      },
      onError: (message) => {
        if (this.sessions.get(paneId) !== managed) return;
        this.callbacks.onData({
          paneId,
          data: `\r\n\x1b[31m[SSH Error] ${message}\x1b[0m\r\n`,
        });
        this.callbacks.onStatus({ paneId, status: 'error', message });
      },
      onClose: () => {
        if (this.sessions.get(paneId) !== managed) return;
        this.callbacks.onData({
          paneId,
          data: `\r\n\x1b[33m[NovaTerm] SSH connection closed.\x1b[0m\r\n`,
        });
        this.callbacks.onStatus({ paneId, status: 'disconnected' });
        void this.cleanupSession(paneId, managed);
      },
    });

    managed.backend = backend;
    this.sessions.set(paneId, managed);
  }

  private scheduleAutoCommand(
    managed: ManagedSession,
    command: string,
    delayMs: number,
  ): void {
    managed.autoCommandTimer = setTimeout(() => {
      if (this.sessions.has(managed.paneId)) {
        managed.backend.write(`${command}\r`);
      }
    }, Math.max(100, delayMs));
  }

  public writeToSession(paneId: string, data: string): void {
    this.sessions.get(paneId)?.backend.write(data);
  }

  public resizeSession(paneId: string, cols: number, rows: number): void {
    this.sessions.get(paneId)?.backend.resize(cols, rows);
  }

  public getSessionCwd(paneId: string): string | undefined {
    const cwd = this.sessions.get(paneId)?.backend.getCwd();
    if (cwd) {
      this.callbacks.onCwd({ paneId, cwd });
    }
    return cwd;
  }

  public startContinuousLog(
    paneId: string,
    customFilePath?: string,
  ): { filePath: string } | null {
    const managed = this.sessions.get(paneId);
    if (!managed) {
      return null;
    }
    if (managed.recorder) {
      return { filePath: managed.recorder.getFilePath() };
    }
    const quota = this.configStore.getConfig().logQuota;
    const recorder = new LogRecorder(paneId, quota, customFilePath);
    recorder.start();
    managed.recorder = recorder;
    return { filePath: recorder.getFilePath() };
  }

  public async stopContinuousLog(paneId: string): Promise<void> {
    const managed = this.sessions.get(paneId);
    if (managed?.recorder) {
      await managed.recorder.stop();
      managed.recorder = null;
    }
  }

  public isLogging(paneId: string): boolean {
    return Boolean(this.sessions.get(paneId)?.recorder);
  }

  public updateLogQuota(quota: LogQuotaConfig): void {
    for (const managed of this.sessions.values()) {
      managed.recorder?.updateQuota(quota);
    }
  }

  public async closeSession(paneId: string): Promise<void> {
    const managed = this.sessions.get(paneId);
    if (!managed) {
      return;
    }
    managed.backend.close();
    await this.cleanupSession(paneId, managed);
  }

  private async cleanupSession(
    paneId: string,
    expected?: ManagedSession,
  ): Promise<void> {
    const managed = this.sessions.get(paneId);
    if (!managed || (expected && managed !== expected)) {
      return;
    }
    this.sessions.delete(paneId);
    if (managed.autoCommandTimer) {
      clearTimeout(managed.autoCommandTimer);
    }
    if (managed.recorder) {
      await managed.recorder.stop();
      managed.recorder = null;
    }
  }

  public async closeAll(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.all(ids.map((id) => this.closeSession(id)));
  }
}
