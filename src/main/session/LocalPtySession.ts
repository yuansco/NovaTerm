import fs from 'fs';
import os from 'os';
import path from 'path';
import * as pty from '@lydell/node-pty';

const OSC7_REGEX = /\x1b\]7;file:\/\/[^/\x07\x1b]*([^\x07\x1b]+)(?:\x07|\x1b\\)/g;

function resolveDefaultShell(explicitShell?: string): string {
  if (explicitShell) {
    return explicitShell;
  }
  if (process.platform === 'win32') {
    return 'powershell.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

function parseOsc7Cwd(data: string): string | undefined {
  if (!data.includes('\x1b]7;')) {
    return undefined;
  }
  let latest: string | undefined;
  OSC7_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = OSC7_REGEX.exec(data)) !== null) {
    try {
      let decoded = decodeURIComponent(match[1]);
      if (process.platform === 'win32') {
        decoded = decoded.replace(/^\/([A-Za-z]:)/, '$1');
      }
      const normalized = path.normalize(decoded);
      if (fs.existsSync(normalized)) {
        latest = normalized;
      }
    } catch {
      // Ignore malformed OSC 7 URI
    }
  }
  return latest;
}

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
    const shell = resolveDefaultShell(options.shell);
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
        const oscCwd = parseOsc7Cwd(data);
        if (oscCwd) {
          this.initialCwd = oscCwd;
        }
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
