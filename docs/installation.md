# Installation Guide

NovaTerm is cross-platform and supports both **Ubuntu / Linux** and **Windows 10/11**.

## Prerequisites

- **Node.js**: v20+ (tested on Node.js v24.22.3)
- **npm**: v10+
- **Linux**: X11 (`DISPLAY=:0`) or Wayland (`WAYLAND_DISPLAY=wayland-0`)
- **Windows**: Windows 10/11 (`powershell.exe` / ConPTY)

## Install Dependencies

```bash
npm install
```

> **Note on PTY Native Module (`@lydell/node-pty`)**:
> NovaTerm uses `@lydell/node-pty`, which ships prebuilt N-API binaries for Linux x64 and Windows x64, so no `gcc`/`g++`/`make` or Visual Studio Build Tools toolchain is required. If you switch to upstream `node-pty` and need to recompile against Electron's ABI, run:
> ```bash
> npm run rebuild
> ```

## Running NovaTerm

### Production Build & Launch

```bash
npm run build
npm start
```

> **Note on Ubuntu Sandbox (`chrome-sandbox`)**:
> Ubuntu 24.04+ restricts unprivileged user namespaces by default, so `npm start` and `npm run dev` pass `--no-sandbox` to Electron when running directly from `node_modules`. If you prefer running with the SUID sandbox instead, set root ownership and `4755` permissions on `node_modules/electron/dist/chrome-sandbox`:
> ```bash
> sudo chown root:root node_modules/electron/dist/chrome-sandbox && sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
> ```

### Development Mode

```bash
npm run dev
```

This starts the Vite renderer dev server on `http://localhost:5173`, compiles the Electron Main Process in watch mode, and launches Electron.

### Typechecking & Tests

```bash
npm run typecheck
npm test
```

## Packaging for Linux

NovaTerm uses `electron-builder` with a custom `scripts/afterPack.js` hook that wraps the Linux executable (`novaterm` -> `novaterm.bin` + `--no-sandbox` launcher) and unpacks `@lydell/node-pty*` from `app.asar`. On first launch, NovaTerm also ensures `~/.local/share/applications/novaterm.desktop` and `~/.local/share/icons/novaterm.png` exist so the app icon appears properly in the Ubuntu dock/launcher even when run from `linux-unpacked`.

### 1. Build Unpacked Executable (`release/linux-unpacked/novaterm`)

```bash
npm run pack:dir
```

Run directly (no extra flags needed):

```bash
./release/linux-unpacked/novaterm
```

To install as a `novaterm` command in `~/.local/bin`:

```bash
mkdir -p ~/.local/bin
ln -sf "$(pwd)/release/linux-unpacked/novaterm" ~/.local/bin/novaterm
```

### 2. Build `.AppImage` and `.deb` Installers

Make sure `package.json` includes `author`, `homepage`, and `build.linux.maintainer` (required by `fpm` when building `.deb` packages), then run:

```bash
npm run pack:linux
```

This compiles both Main & Renderer processes and generates the installers under `release/`:

- `release/NovaTerm-1.0.2.AppImage`
- `release/nova-term_1.0.2_amd64.deb`

#### Install `.deb` system-wide

```bash
sudo dpkg -i release/nova-term_1.0.2_amd64.deb
```

After installation, launch `novaterm` from your terminal or Ubuntu application launcher. To uninstall later:

```bash
sudo apt remove nova-term
```

#### Run `.AppImage` directly

```bash
chmod +x release/NovaTerm-1.0.2.AppImage
./release/NovaTerm-1.0.2.AppImage
```

## Packaging for Windows

Run on a Windows machine (so `npm install` downloads `@lydell/node-pty-win32-x64`):

```powershell
npm install
npm run pack:win
```

This builds both Main & Renderer processes and generates Windows artifacts under `release/`:

- **NSIS Installer** (`.exe`)
- **Portable Executable** (`.exe`)
