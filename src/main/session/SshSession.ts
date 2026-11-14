import fs from 'fs';
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { SshProfile } from '../../shared/types';
import { TerminalSessionBackend } from './LocalPtySession';

export interface SshSessionOptions {
  profile: SshProfile;
  cols: number;
  rows: number;
  onData: (data: string) => void;
  onConnected: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export class SshSession implements TerminalSessionBackend {
  private readonly client = new Client();
  private channel: ClientChannel | null = null;
  private closed = false;
  private cols: number;
  private rows: number;

  constructor(options: SshSessionOptions) {
    this.cols = Math.max(2, options.cols);
    this.rows = Math.max(1, options.rows);

    const { profile } = options;
    const connectConfig: ConnectConfig = {
      host: profile.host,
      port: profile.port || 22,
      username: profile.username,
      keepaliveInterval: profile.keepAliveIntervalMs ?? 15000,
      readyTimeout: 15000,
    };

    if (profile.authType === 'password') {
      connectConfig.password = profile.password ?? '';
    } else if (profile.authType === 'privateKey' && profile.privateKeyPath) {
      try {
        connectConfig.privateKey = fs.readFileSync(profile.privateKeyPath);
        if (profile.passphrase) {
          connectConfig.passphrase = profile.passphrase;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        queueMicrotask(() => options.onError(`Failed to read private key: ${msg}`));
        return;
      }
    } else if (profile.authType === 'agent') {
      connectConfig.agent = process.env.SSH_AUTH_SOCK;
    }

    this.client.on('ready', () => {
      if (this.closed) {
        this.client.end();
        return;
      }
      this.client.shell(
        {
          term: 'xterm-256color',
          cols: this.cols,
          rows: this.rows,
        },
        (err, stream) => {
          if (err) {
            options.onError(`SSH shell error: ${err.message}`);
            this.close();
            return;
          }
          this.channel = stream;
          options.onConnected();

          stream.on('data', (chunk: Buffer) => {
            if (!this.closed) {
              options.onData(chunk.toString('utf8'));
            }
          });

          stream.stderr?.on('data', (chunk: Buffer) => {
            if (!this.closed) {
              options.onData(chunk.toString('utf8'));
            }
          });

          stream.on('close', () => {
            if (!this.closed) {
              this.closed = true;
              this.client.end();
              options.onClose();
            }
          });
        },
      );
    });

    this.client.on('error', (err) => {
      if (!this.closed) {
        options.onError(`SSH connection error: ${err.message}`);
      }
    });

    this.client.on('close', () => {
      if (!this.closed) {
        this.closed = true;
        options.onClose();
      }
    });

    this.client.connect(connectConfig);
  }

  public write(data: string): void {
    if (!this.closed && this.channel) {
      this.channel.write(data);
    }
  }

  public resize(cols: number, rows: number): void {
    this.cols = Math.max(2, cols);
    this.rows = Math.max(1, rows);
    if (!this.closed && this.channel) {
      this.channel.setWindow(this.rows, this.cols, 0, 0);
    }
  }

  public getCwd(): string | undefined {
    return undefined;
  }

  public close(): void {
    if (!this.closed) {
      this.closed = true;
      try {
        this.channel?.end();
        this.client.end();
      } catch {
        // Ignore close errors
      }
    }
  }
}
