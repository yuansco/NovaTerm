import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { LogRecorder, stripAnsiSequences } from '../dist/main/logging/LogRecorder.js';

test('stripAnsiSequences removes ANSI color and cursor sequences', () => {
  const raw = '\x1b[32mOK\x1b[0m \x1b[1;34mhello\x1b[0m\n';
  assert.equal(stripAnsiSequences(raw), 'OK hello\n');
});

test('LogRecorder rotates log files by maxLines and retains maxRotatedFiles', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novaterm-log-test-'));
  const logFile = path.join(tmpDir, 'session.log');

  try {
    const recorder = new LogRecorder(
      'test-pane',
      {
        enabled: true,
        maxFileSizeMB: 10,
        maxLines: 100,
        maxRotatedFiles: 2,
        stripAnsi: true,
        logDirectory: tmpDir,
      },
      logFile,
    );

    recorder.start();
    for (let i = 0; i < 250; i++) {
      recorder.write(`\x1b[33mline-${i}\x1b[0m\n`);
      if (i % 105 === 0) {
        await new Promise((r) => setTimeout(r, 40));
      }
    }
    await new Promise((r) => setTimeout(r, 60));
    await recorder.stop();

    assert.ok(fs.existsSync(logFile), 'active log file should exist');
    assert.ok(fs.existsSync(`${logFile}.1`), 'rotated .1 log file should exist');
    assert.ok(!fs.existsSync(`${logFile}.3`), 'should not exceed maxRotatedFiles=2');

    const content = fs.readFileSync(logFile, 'utf8');
    assert.ok(!content.includes('\x1b['), 'ANSI sequences should be stripped');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
