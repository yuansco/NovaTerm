import fs from 'fs';
import path from 'path';
import { LogQuotaConfig } from '../../shared/types';

const ANSI_ESCAPE_REGEX =
  // eslint-disable-next-line no-control-regex
  /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;

export function stripAnsiSequences(input: string): string {
  if (!input.includes('\x1b')) {
    return input;
  }
  return input.replace(ANSI_ESCAPE_REGEX, '');
}

function countNewlines(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      count++;
    }
  }
  return count;
}

export class LogRecorder {
  private readonly sessionId: string;
  private readonly baseFilePath: string;
  private quota: LogQuotaConfig;
  private stream: fs.WriteStream | null = null;
  private currentBytes = 0;
  private currentLines = 0;
  private isRotating = false;
  private pendingQueue: string[] = [];
  private closed = false;

  constructor(sessionId: string, quota: LogQuotaConfig, customFilePath?: string) {
    this.sessionId = sessionId;
    this.quota = { ...quota };
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    this.baseFilePath =
      customFilePath ?? path.join(quota.logDirectory, `session-${safeId}.log`);
  }

  public getFilePath(): string {
    return this.baseFilePath;
  }

  public getStats(): { bytes: number; lines: number; filePath: string } {
    return {
      bytes: this.currentBytes,
      lines: this.currentLines,
      filePath: this.baseFilePath,
    };
  }

  public updateQuota(quota: LogQuotaConfig): void {
    this.quota = { ...quota };
  }

  public start(): void {
    if (this.stream || this.closed) {
      return;
    }
    fs.mkdirSync(path.dirname(this.baseFilePath), { recursive: true });
    if (fs.existsSync(this.baseFilePath)) {
      const stat = fs.statSync(this.baseFilePath);
      this.currentBytes = stat.size;
      // Approximate initial line count without loading huge files into RAM
      this.currentLines = 0;
    }
    this.openStream();
  }

  private openStream(): void {
    this.stream = fs.createWriteStream(this.baseFilePath, {
      flags: 'a',
      encoding: 'utf8',
    });
    this.stream.on('error', (err) => {
      console.error(`[LogRecorder:${this.sessionId}] Stream error:`, err);
    });
  }

  public write(rawChunk: string): void {
    if (this.closed || !this.stream) {
      return;
    }

    const payload = this.quota.stripAnsi ? stripAnsiSequences(rawChunk) : rawChunk;
    if (!payload) {
      return;
    }

    if (this.isRotating) {
      this.pendingQueue.push(payload);
      return;
    }

    this.writeChunkInternal(payload);
  }

  private writeChunkInternal(payload: string): void {
    if (!this.stream || this.closed) {
      return;
    }

    const chunkBytes = Buffer.byteLength(payload, 'utf8');
    const chunkLines = countNewlines(payload);

    this.stream.write(payload);
    this.currentBytes += chunkBytes;
    this.currentLines += chunkLines;

    const maxBytes = Math.max(1, this.quota.maxFileSizeMB) * 1024 * 1024;
    const maxLines = Math.max(100, this.quota.maxLines);

    if (this.currentBytes >= maxBytes || this.currentLines >= maxLines) {
      void this.rotate();
    }
  }

  private async rotate(): Promise<void> {
    if (this.isRotating || this.closed) {
      return;
    }
    this.isRotating = true;

    try {
      await this.closeCurrentStream();

      const maxFiles = Math.max(1, this.quota.maxRotatedFiles);
      const oldest = `${this.baseFilePath}.${maxFiles}`;
      if (fs.existsSync(oldest)) {
        await fs.promises.unlink(oldest);
      }

      for (let i = maxFiles - 1; i >= 1; i--) {
        const src = `${this.baseFilePath}.${i}`;
        const dst = `${this.baseFilePath}.${i + 1}`;
        if (fs.existsSync(src)) {
          await fs.promises.rename(src, dst);
        }
      }

      if (fs.existsSync(this.baseFilePath)) {
        await fs.promises.rename(this.baseFilePath, `${this.baseFilePath}.1`);
      }

      this.currentBytes = 0;
      this.currentLines = 0;
      if (!this.closed) {
        this.openStream();
      }
    } catch (err) {
      console.error(`[LogRecorder:${this.sessionId}] Rotation error:`, err);
      if (!this.stream && !this.closed) {
        this.openStream();
      }
    } finally {
      this.isRotating = false;
      const queued = this.pendingQueue.splice(0, this.pendingQueue.length);
      for (const item of queued) {
        this.writeChunkInternal(item);
      }
    }
  }

  private closeCurrentStream(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.stream) {
        resolve();
        return;
      }
      const s = this.stream;
      this.stream = null;
      s.end(() => resolve());
    });
  }

  public async stop(): Promise<void> {
    this.closed = true;
    this.pendingQueue = [];
    await this.closeCurrentStream();
  }

  public static async saveSnapshot(
    filePath: string,
    content: string,
    stripAnsi: boolean,
  ): Promise<void> {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const finalContent = stripAnsi ? stripAnsiSequences(content) : content;
    await fs.promises.writeFile(filePath, finalContent, 'utf8');
  }
}
