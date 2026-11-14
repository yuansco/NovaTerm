# User Guide

## Smart Tabs & Split Panes

- **New Tab**: Click `+` in the tab bar or press `Ctrl+Shift+T`.
- **Rename Tab**: Double-click any tab title, type the new name, and press `Enter`.
- **Reorder Tabs**: Drag and drop tabs horizontally in the tab bar.
- **Split Panes**:
  - Vertical split (side-by-side): `Ctrl+Shift+D` or toolbar/context menu.
  - Horizontal split (top-and-bottom): `Ctrl+Shift+E` or toolbar/context menu.
- **Close Pane**: `Ctrl+Shift+W` or click the `×` button in the pane header.
- **Switch Pane Focus**: `Alt+ArrowLeft` / `Alt+ArrowRight` / `Alt+ArrowUp` / `Alt+ArrowDown`.
- **Resize Panes**: Drag the divider bar between panes, or press `Ctrl+Shift+Arrow` keys.

## Right-Click Context Menu

Right-click inside any terminal pane to access:

1. **Copy**: Copies the selected text. If no text is selected, it automatically copies the **entire terminal buffer**.
2. **Paste**: Pastes text from the system clipboard.
3. **Save Log (Snapshot)**: Exports the current terminal buffer to a `.log` file.
4. **Continuous Log Streaming**: Starts/stops asynchronous `fs.createWriteStream` logging to disk with automatic quota rotation (by max MB or max line count).

## Built-in SSH Connection Manager

Click the **Server** icon in the top-right toolbar to open the SSH Manager:

- Organize profiles by **Category** (e.g., `Production`, `Staging`, `HomeLab`).
- Choose authentication: **Password** (encrypted with OS keyring via Electron `safeStorage`), **Private Key** (with optional passphrase), or **SSH Agent**.
- Configure an optional **Auto-run Command** per SSH profile (e.g., `tmux attach || tmux new`).

## Key Macros & Auto-Run Commands

Open **Settings** (gear icon):

- **Key Macros**: Bind keys such as `F1` to commands like `cd ~/project;python -m venv venv` with optional automatic `Enter`.
- **Auto Commands**: Set global startup commands for new local tabs/panes or SSH sessions with a configurable startup delay (`delayMs`).
