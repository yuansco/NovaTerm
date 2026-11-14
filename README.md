# NovaTerm

A modern Ubuntu desktop terminal emulator built with **Electron**, **React**, **TypeScript**, **xterm.js** (with WebGL acceleration), **@lydell/node-pty**, and **ssh2**.

## Key Features

- **Smart Tabs & Unlimited Split Panes**: Add, close, double-click rename, drag-and-drop reorder tabs; infinite hierarchical horizontal/vertical split panes with mouse drag or keyboard resizing.
- **Built-in SSH Client**: Categorized SSH Connection Manager with password, private key, and SSH agent authentication, plus encrypted credential storage via Electron `safeStorage`.
- **Session & State Persistence**: Automatically saves and restores tabs, split pane binary tree ratios, and local working directories (`CWD`) across restarts.
- **24-bit True Color Themes**: Built-in One Dark, Dracula, Monokai, Solarized Dark, and Nord themes with extensible custom CSS support.
- **Productivity Tools**:
  - Right-click context menu: Copy (automatically copies full terminal buffer when nothing is selected), Paste, Save Log Snapshot, and Continuous Log Streaming with size/line rotation.
  - Custom key macros (e.g. `F1` -> `cd ~/project;python -m venv venv`).
  - Auto-run startup commands for new local tabs and SSH connections.
  - Full JSON configuration export/import for backup and migration.

## Quick Start

Execute from source code
```bash
npm install
npm run build
npm start
```

Build Unpacked Executable and run directly (output to `release/`):
```
npm run pack:dir
./release/linux-unpacked/novaterm
```
Run unit tests:

```bash
npm test
```

Package `.AppImage` and `.deb` installers (output to `release/`):

```bash
npm run pack:linux
```

## Documentation

- [Installation Guide](docs/installation.md)
- [User Guide](docs/user-guide.md)
- [Configuration & Backup Guide](docs/configuration.md)
