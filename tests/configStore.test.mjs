import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ConfigStore } from '../dist/main/store/ConfigStore.js';

test('ConfigStore persists SSH credentials securely and exports/imports full JSON config', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novaterm-cfg-test-'));

  try {
    const store = new ConfigStore(tmpDir);
    store.upsertSshProfile({
      id: 'prod-1',
      name: 'Prod Server',
      category: 'Production',
      host: '10.0.0.5',
      port: 2222,
      username: 'deploy',
      authType: 'password',
      password: 'super-secret-password',
      autoCommand: 'cd /var/www',
    });

    const listed = store.listSshProfiles();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].password, undefined);
    assert.ok(listed[0].encryptedPassword);

    const decrypted = store.getDecryptedSshProfile('prod-1');
    assert.equal(decrypted?.password, 'super-secret-password');

    const cfg = store.getConfig();
    cfg.themeId = 'dracula';
    store.saveConfig(cfg);

    const exported = store.exportConfigJson();
    const parsed = JSON.parse(exported);
    assert.equal(parsed.themeId, 'dracula');
    assert.ok(parsed.workspaceSnapshot);
    assert.equal(parsed.sshProfiles.length, 1);

    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'novaterm-cfg-test-2-'));
    try {
      const store2 = new ConfigStore(tmpDir2);
      const imported = store2.importConfigJson(exported);
      assert.equal(imported.config.themeId, 'dracula');
      assert.equal(imported.config.sshProfiles[0].host, '10.0.0.5');
    } finally {
      fs.rmSync(tmpDir2, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
