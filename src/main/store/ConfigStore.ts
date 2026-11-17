import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  AppConfig,
  SshProfile,
  WorkspaceState,
} from '../../shared/types';
import { createLeafPane } from '../../shared/paneTree';

export interface SecretCipher {
  isAvailable(): boolean;
  encrypt(plaintext: string): string;
  decrypt(encoded: string): string;
}

class DefaultPlainFallbackCipher implements SecretCipher {
  public isAvailable(): boolean {
    return true;
  }
  public encrypt(plaintext: string): string {
    return `plain:${Buffer.from(plaintext, 'utf8').toString('base64')}`;
  }
  public decrypt(encoded: string): string {
    if (encoded.startsWith('plain:')) {
      return Buffer.from(encoded.slice(6), 'base64').toString('utf8');
    }
    return encoded;
  }
}

export function createElectronSecretCipher(safeStorage: {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}): SecretCipher {
  const fallback = new DefaultPlainFallbackCipher();
  return {
    isAvailable: () => {
      try {
        return safeStorage.isEncryptionAvailable();
      } catch {
        return false;
      }
    },
    encrypt: (plaintext: string) => {
      try {
        if (safeStorage.isEncryptionAvailable()) {
          return `enc:${safeStorage.encryptString(plaintext).toString('base64')}`;
        }
      } catch {
        // Fallback when OS keyring is unavailable
      }
      return fallback.encrypt(plaintext);
    },
    decrypt: (encoded: string) => {
      if (encoded.startsWith('enc:')) {
        const buf = Buffer.from(encoded.slice(4), 'base64');
        return safeStorage.decryptString(buf);
      }
      return fallback.decrypt(encoded);
    },
  };
}

export function createDefaultConfig(_baseDir: string): AppConfig {
  return {
    version: 1,
    language: 'zh-TW',
    themeId: 'one-dark',
    customThemes: [],
    fontFamily: '"JetBrains Mono", "Fira Code", "Ubuntu Mono", monospace',
    fontSize: 14,
    lineHeight: 1.25,
    useWebGL: false,
    scrollback: 10000,
    logQuota: {
      enabled: false,
      maxFileSizeMB: 10,
      maxLines: 100000,
      maxRotatedFiles: 5,
      stripAnsi: true,
      logDirectory: os.homedir(),
    },
    macros: [
      {
        id: 'macro-f1',
        name: 'cros_sdk',
        shortcut: 'F1',
        command: 'cd ~/chromiumos;cros_sdk --no-ns-pid --no-update',
        appendNewline: true,
      },
      {
        id: 'macro-f2',
        name: 'Start Servod',
        shortcut: 'F2',
        command: "start-servod --channel=release -p 9999 -f=INFO --allow_offline -b ",
        appendNewline: false,
      },
      {
        id: 'macro-f3',
        name: 'EC UART Console',
        shortcut: 'F3',
        command: "sudo picocom $(dut-control -- ec_uart_pty | cut -d':' -f2 | tr -d '\\r\\n ')",
        appendNewline: true,
      },
      {
        id: 'macro-f4',
        name: 'CPU UART Console',
        shortcut: 'F4',
        command: "sudo picocom $(dut-control -- cpu_uart_pty | cut -d':' -f2 | tr -d '\\r\\n ')",
        appendNewline: true,
      },
    ],
    quickCommands: [
      {
        id: 'qc-uname',
        label: 'uname -a',
        command: 'uname -a',
        appendNewline: true,
      },
    ],
    showQuickCommandBar: true,
    autoCommands: {
      onNewLocalTab: '',
      onNewSshTab: '',
      delayMs: 350,
    },
    sshProfiles: [],
  };
}

export function createDefaultWorkspaceState(): WorkspaceState {
  const leaf = createLeafPane(
    { type: 'local', cwd: os.homedir() },
    'Local Shell',
  );
  return {
    tabs: [
      {
        id: 'tab-initial',
        title: 'Local Shell',
        rootPane: leaf,
        activePaneId: leaf.id,
      },
    ],
    activeTabId: 'tab-initial',
  };
}

export class ConfigStore {
  private readonly baseDir: string;
  private readonly configPath: string;
  private readonly statePath: string;
  private readonly cipher: SecretCipher;
  private config: AppConfig;
  private workspaceState: WorkspaceState;

  constructor(baseDir: string, cipher?: SecretCipher) {
    this.baseDir = baseDir;
    this.configPath = path.join(baseDir, 'config.json');
    this.statePath = path.join(baseDir, 'workspace-state.json');
    this.cipher = cipher ?? new DefaultPlainFallbackCipher();
    fs.mkdirSync(this.baseDir, { recursive: true });
    this.config = this.readConfigFromDisk();
    this.workspaceState = this.readWorkspaceFromDisk();
  }

  private readConfigFromDisk(): AppConfig {
    const defaults = createDefaultConfig(this.baseDir);
    if (!fs.existsSync(this.configPath)) {
      this.writeJson(this.configPath, defaults);
      return defaults;
    }
    try {
      const raw = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AppConfig>;
      return {
        ...defaults,
        ...parsed,
        logQuota: { ...defaults.logQuota, ...(parsed.logQuota ?? {}) },
        autoCommands: { ...defaults.autoCommands, ...(parsed.autoCommands ?? {}) },
        customThemes: Array.isArray(parsed.customThemes) ? parsed.customThemes : [],
        macros: Array.isArray(parsed.macros) ? parsed.macros : defaults.macros,
        quickCommands: Array.isArray(parsed.quickCommands)
          ? parsed.quickCommands
          : defaults.quickCommands,
        sshProfiles: Array.isArray(parsed.sshProfiles) ? parsed.sshProfiles : [],
      };
    } catch (err) {
      console.error('[ConfigStore] Failed to parse config.json, using defaults:', err);
      return defaults;
    }
  }

  private readWorkspaceFromDisk(): WorkspaceState {
    if (!fs.existsSync(this.statePath)) {
      const initial = createDefaultWorkspaceState();
      this.writeJson(this.statePath, initial);
      return initial;
    }
    try {
      const raw = fs.readFileSync(this.statePath, 'utf8');
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) {
        return createDefaultWorkspaceState();
      }
      return parsed;
    } catch (err) {
      console.error('[ConfigStore] Failed to parse workspace-state.json:', err);
      return createDefaultWorkspaceState();
    }
  }

  private writeJson(filePath: string, data: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public saveConfig(nextConfig: AppConfig): AppConfig {
    const sanitizedProfiles = (nextConfig.sshProfiles ?? []).map((profile) =>
      this.encryptProfileSecrets(profile),
    );
    this.config = {
      ...nextConfig,
      sshProfiles: sanitizedProfiles,
    };
    this.writeJson(this.configPath, this.config);
    return this.config;
  }

  public getWorkspaceState(): WorkspaceState {
    return this.workspaceState;
  }

  public saveWorkspaceState(state: WorkspaceState): void {
    this.workspaceState = state;
    this.writeJson(this.statePath, state);
  }

  public listSshProfiles(): SshProfile[] {
    return this.config.sshProfiles.map((p) => ({
      ...p,
      password: undefined,
      passphrase: undefined,
    }));
  }

  public upsertSshProfile(profile: SshProfile): SshProfile[] {
    const existing = this.config.sshProfiles.find((p) => p.id === profile.id);
    const merged: SshProfile = {
      ...existing,
      ...profile,
    };
    const secured = this.encryptProfileSecrets(merged);
    const others = this.config.sshProfiles.filter((p) => p.id !== profile.id);
    this.config = {
      ...this.config,
      sshProfiles: [...others, secured],
    };
    this.writeJson(this.configPath, this.config);
    return this.listSshProfiles();
  }

  public deleteSshProfile(profileId: string): SshProfile[] {
    this.config = {
      ...this.config,
      sshProfiles: this.config.sshProfiles.filter((p) => p.id !== profileId),
    };
    this.writeJson(this.configPath, this.config);
    return this.listSshProfiles();
  }

  public getDecryptedSshProfile(profileId: string): SshProfile | undefined {
    const profile = this.config.sshProfiles.find((p) => p.id === profileId);
    if (!profile) {
      return undefined;
    }
    return {
      ...profile,
      password: profile.encryptedPassword
        ? this.cipher.decrypt(profile.encryptedPassword)
        : undefined,
      passphrase: profile.encryptedPassphrase
        ? this.cipher.decrypt(profile.encryptedPassphrase)
        : undefined,
    };
  }

  private encryptProfileSecrets(profile: SshProfile): SshProfile {
    const copy: SshProfile = { ...profile };
    if (copy.password !== undefined && copy.password !== '') {
      copy.encryptedPassword = this.cipher.encrypt(copy.password);
    }
    delete copy.password;

    if (copy.passphrase !== undefined && copy.passphrase !== '') {
      copy.encryptedPassphrase = this.cipher.encrypt(copy.passphrase);
    }
    delete copy.passphrase;

    return copy;
  }

  public exportConfigJson(): string {
    const exportPayload: AppConfig = {
      ...this.config,
      sshProfiles: this.config.sshProfiles.map((p) => ({
        ...p,
        password: undefined,
        passphrase: undefined,
      })),
      workspaceSnapshot: this.workspaceState,
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  public importConfigJson(rawJson: string): {
    config: AppConfig;
    workspaceState: WorkspaceState;
  } {
    const parsed = JSON.parse(rawJson) as Partial<AppConfig>;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON configuration file.');
    }

    const defaults = createDefaultConfig(this.baseDir);
    const { workspaceSnapshot, ...restConfig } = parsed;

    const mergedConfig: AppConfig = {
      ...defaults,
      ...restConfig,
      logQuota: { ...defaults.logQuota, ...(restConfig.logQuota ?? {}) },
      autoCommands: { ...defaults.autoCommands, ...(restConfig.autoCommands ?? {}) },
      customThemes: Array.isArray(restConfig.customThemes)
        ? restConfig.customThemes
        : this.config.customThemes,
      macros: Array.isArray(restConfig.macros)
        ? restConfig.macros
        : this.config.macros,
      quickCommands: Array.isArray(restConfig.quickCommands)
        ? restConfig.quickCommands
        : this.config.quickCommands,
      sshProfiles: Array.isArray(restConfig.sshProfiles)
        ? restConfig.sshProfiles
        : this.config.sshProfiles,
    };

    this.saveConfig(mergedConfig);

    if (
      workspaceSnapshot &&
      Array.isArray(workspaceSnapshot.tabs) &&
      workspaceSnapshot.tabs.length > 0
    ) {
      this.saveWorkspaceState(workspaceSnapshot);
    }

    return {
      config: this.config,
      workspaceState: this.workspaceState,
    };
  }
}
