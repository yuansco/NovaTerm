import fs from 'fs';
import os from 'os';
import * as pty from '@lydell/node-pty';

export interface TerminalSessionBackend {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
  getCwd(): string | undefined;
}

export interface LocalPtyOptions {
  cwd?: string;
  shell?: string;
  cols: number;
  rows: number;
  onData: (data: string) => void;
  onExit: (exitCode: number) => void;
}

export class LocalPtySession implements TerminalSessionBackend {
  private readonly ptyProcess: pty.IPty;
  private initialCwd: string;
  private closed = false;

  constructor(options: LocalPtyOptions) {
    const shell = options.shell || process.env.SHELL || '/bin/bash';
    const cwd =
      options.cwd && fs.existsSync(options.cwd) ? options.cwd : os.homedir();
    this.initialCwd = cwd;

    const env: Record<string, string> = {};
    for (const [key, val] of Object.entries(process.env)) {
      if (val !== undefined) {
        env[key] = val;
      }
    }
    env.TERM = 'xterm-256color';
    env.COLORTERM = 'truecolor';

    this.ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: Math.max(2, options.cols),
      rows: Math.max(1, options.rows),
      cwd,
      env,
    });

    this.ptyProcess.onData((data) => {
      if (!this.closed) {
        options.onData(data);
      }
    });

    this.ptyProcess.onExit(({ exitCode }) => {
      this.closed = true;
      options.onExit(exitCode);
    });
  }

  public write(data: string): void {
    if (!this.closed) {
      this.ptyProcess.write(data);
    }
  }

  public resize(cols: number, rows: number): void {
    if (!this.closed && cols > 1 && rows > 0) {
      try {
        this.ptyProcess.resize(cols, rows);
      } catch {
        // Ignore resize race on exiting PTY
      }
    }
  }

  public getCwd(): string | undefined {
    if (this.closed) {
      return this.initialCwd;
    }
    try {
      const procCwd = `/proc/${this.ptyProcess.pid}/cwd`;
      if (fs.existsSync(procCwd)) {
        const resolved = fs.readlinkSync(procCwd);
        this.initialCwd = resolved;
        return resolved;
      }
    } catch {
      // Fallback to last known CWD
    }
    return this.initialCwd;
  }

  public close(): void {
    if (!this.closed) {
      this.closed = true;
      try {
        this.ptyProcess.kill();
      } catch {
        // Already exited
      }
    }
  }
}
