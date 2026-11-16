# NovaTerm

A modern cross-platform desktop terminal emulator for **Ubuntu / Linux** and **Windows**, built with **Electron**, **React**, **TypeScript**, **xterm.js** (with WebGL acceleration), **@lydell/node-pty**, and **ssh2**.

## Key Features

- **Cross-Platform Local Shells**: Runs `$SHELL` / `/bin/bash` on Linux and `powershell.exe` on Windows, with cross-platform working directory (`CWD`) tracking via `/proc` and OSC 7 sequences.
- **Smart Tabs & Unlimited Split Panes**: Add, close, double-click rename, drag-and-drop reorder tabs; infinite hierarchical horizontal/vertical split panes with mouse drag or keyboard resizing.
- **Built-in SSH Client**: Categorized SSH Connection Manager (`Ctrl+Shift+S`) with password (encrypted via Electron `safeStorage`), private key (with `~/` expansion), and SSH Agent (`SSH_AUTH_SOCK` on Linux, `\\.\pipe\openssh-ssh-agent` on Windows) authentication.
- **Floating Quick Commands**: Draggable, resizable floating panel for one-click execution of single-line or multi-line commands in the active pane.
- **Session & State Persistence**: Automatically saves and restores tabs, split pane binary tree ratios, and local working directories (`CWD`) across restarts.
- **24-bit True Color Themes & Bilingual UI**: Built-in One Dark, Dracula, Monokai, Solarized Dark, and Nord themes with extensible custom CSS support, plus Traditional Chinese (`zh-TW`) and English (`en`) UI.
- **Productivity Tools**:
  - Right-click context menu: Copy (automatically copies full terminal buffer when nothing is selected), Paste, Save Log Snapshot (`.txt`), and Continuous Log Streaming (`.log`) with size/line rotation.
  - Custom key macros (e.g. `F1` -> `cd ~/project;python -m venv venv`).
  - Auto-run startup commands for new local tabs and SSH connections.
  - Full JSON configuration export/import for backup and migration.

## Quick Start

### Install on Ubuntu / Linux (.deb)

```bash
URL=$(curl -fsSL \
  https://api.github.com/repos/yuansco/NovaTerm/releases/latest |
  jq -r --arg pattern "$PATTERN" \
  "[.assets[] | select(.name | test(\"\\\\.deb$\";\"i\")) | select(.name | test(\$pattern;\"i\"))][0].browser_download_url // empty")
wget $URL -P /tmp
sudo apt-get install -y /tmp/nova-term_*_amd64.deb
rm -f /tmp/nova-term_*_amd64.deb
```

### Run from Source

```bash
npm install
npm run build
npm start
```

### Typecheck & Unit Tests

```bash
npm run typecheck
npm test
```

### Package for Linux

Build unpacked executable and run directly (output to `release/`):

```bash
npm run pack:dir
./release/linux-unpacked/novaterm
```

Package `.AppImage` and `.deb` installers (output to `release/`):

```bash
npm run pack:linux
```

### Package for Windows

Run on a Windows machine to generate NSIS installer and Portable `.exe` (output to `release/`):

```powershell
npm install
npm run pack:win
```

## Documentation

- [Installation Guide](docs/installation.md)
- [User Guide](docs/user-guide.md)
- [Configuration & Backup Guide](docs/configuration.md)
