# User Guide

## Smart Tabs & Split Panes

- **New Tab**: Click `+` in the tab bar or press `Ctrl+Shift+T`.
  - Default local shell: `$SHELL` or `/bin/bash` on Linux; `powershell.exe` on Windows.
- **Rename Tab**: Double-click any tab title, type the new name, and press `Enter`.
- **Reorder Tabs**: Drag and drop tabs horizontally in the tab bar.
- **Split Panes**:
  - Vertical split (side-by-side): `Ctrl+Shift+D` or toolbar/context menu.
  - Horizontal split (top-and-bottom): `Ctrl+Shift+E` or toolbar/context menu.
- **Close Pane**: `Ctrl+Shift+W` or click the `×` button in the pane header.
- **Switch Pane Focus**: `Alt+ArrowLeft` / `Alt+ArrowRight` / `Alt+ArrowUp` / `Alt+ArrowDown`.
- **Resize Panes**: Drag the divider bar between panes, or press `Ctrl+Shift+Arrow` keys.

## Floating Quick Commands

Click the **Quick Commands** (lightning) icon in the top-right toolbar to toggle the floating quick command panel:

- **One-Click Execution**: Click any command button to send it to the currently focused terminal pane (supports multi-line scripts with automatic newline normalization).
- **Drag & Resize**: Drag the panel header to reposition it anywhere in the window, or drag the bottom-right corner handle to resize it.
- **Manage Commands**: Click the gear icon in the floating panel to add, edit, reorder, or remove quick commands (the editor modal only closes via **Save** or **Cancel** to prevent accidental dismissal).

## Right-Click Context Menu

Right-click inside any terminal pane to access:

1. **Copy**: Copies the selected text. If no text is selected, it automatically copies the **entire terminal buffer**.
2. **Paste**: Pastes text from the system clipboard.
3. **Save Log (Snapshot)**: Exports the current terminal buffer directly to a `.txt` file (`novaterm-log-YYYYMMDD-HHmmss.txt`) in your configured log directory.
4. **Continuous Log Streaming**: Starts/stops asynchronous `fs.createWriteStream` logging to disk (`session-<id>.log`) with automatic quota rotation (by max MB or max line count).

## Built-in SSH Connection Manager

Click the **SSH** button in the top-right toolbar or press `Ctrl+Shift+S` to open the SSH Manager:

- Organize profiles by **Category** (e.g., `Production`, `Staging`, `HomeLab`).
- Choose authentication:
  - **Password**: Encrypted with the OS keyring (Linux Secret Service / Windows DPAPI) via Electron `safeStorage`.
  - **Private Key**: Supports `~/...` home directory expansion on both Linux and Windows, with optional passphrase.
  - **SSH Agent**: Uses `SSH_AUTH_SOCK` on Linux, or automatically falls back to `\\.\pipe\openssh-ssh-agent` on Windows.
- Configure an optional **Auto-run Command** per SSH profile (e.g., `tmux attach || tmux new`).
- The SSH Manager modal only closes via **Save**, **Cancel**, or the close button to prevent accidental dismissal when clicking outside.

## Key Macros, Auto-Run Commands & Themes

Open **Settings** (gear icon):

- **Language & Appearance**: Switch between Traditional Chinese (`zh-TW`) and English (`en`), select or customize themes (including custom CSS), and configure fonts and WebGL rendering.
- **Key Macros**: Bind keys such as `F1` to commands like `cd ~/project;python -m venv venv` with optional automatic `Enter`.
- **Auto Commands**: Set global startup commands for new local tabs/panes or SSH sessions with a configurable startup delay (`delayMs`).
