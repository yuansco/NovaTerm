const fs = require('fs');
const path = require('path');

/**
 * Wraps the Linux Electron binary so `./novaterm` automatically passes
 * `--no-sandbox` on Ubuntu 24.04+ where unprivileged userns is restricted.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') {
    return;
  }

  const appOutDir = context.appOutDir;
  const exeName = context.packager.executableName || 'novaterm';
  const exePath = path.join(appOutDir, exeName);
  const binPath = path.join(appOutDir, `${exeName}.bin`);

  if (!fs.existsSync(exePath)) {
    return;
  }

  fs.renameSync(exePath, binPath);

  const wrapper = `#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "$0")")"
exec "$HERE/${exeName}.bin" --no-sandbox "$@"
`;
  fs.writeFileSync(exePath, wrapper, { mode: 0o755 });
};
