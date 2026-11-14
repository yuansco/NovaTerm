# Configuration & Backup Guide

## Data Storage Locations

NovaTerm stores its persistent configuration and workspace state inside Electron's `userData` directory (`nova-term`):

- **Linux (Ubuntu)**: `~/.config/nova-term/`
- **Windows**: `%APPDATA%\nova-term\` (typically `C:\Users\<username>\AppData\Roaming\nova-term\`)

Files stored in this directory:

- `config.json`: Language (`zh-TW` / `en`), themes, font settings, key macros, floating quick commands, auto-run commands, log quotas, and SSH profiles (with encrypted credentials).
- `workspace-state.json`: Saved tabs, binary split-pane tree layout & ratios, active pane IDs, and local working directories (`CWD`).

Continuous session logs (`session-<id>.log`, `session-<id>.log.1`, ...) are written to `logQuota.logDirectory` (defaults to `os.homedir()`).

## Exporting & Restoring Backup JSON

1. Open **Settings** -> **JSON Export / Import**.
2. Click **Export JSON Config** to save a single `.json` backup file (default filename: `novaterm-config.json` in your Documents folder) containing:
   - `language`, `themeId`, `customThemes`, `fontFamily`, `fontSize`, `lineHeight`, `useWebGL`, `scrollback`
   - `macros` (custom shortcut commands)
   - `quickCommands` & `showQuickCommandBar` (floating quick command panel items & visibility)
   - `autoCommands` (local & SSH startup commands)
   - `logQuota` (max MB, max lines, max rotated files, ANSI stripping, log directory)
   - `sshProfiles`
   - `workspaceSnapshot` (all tabs, split pane trees, ratios, and CWDs)
3. To restore on another machine or after a reset, click **Import JSON Config** and select your `.json` backup file. NovaTerm immediately applies the settings and restores the workspace layout.

## Example `novaterm-config.json`

```json
{
  "version": 1,
  "language": "zh-TW",
  "themeId": "one-dark",
  "customThemes": [],
  "fontFamily": "\"JetBrains Mono\", \"Fira Code\", \"Ubuntu Mono\", monospace",
  "fontSize": 14,
  "lineHeight": 1.25,
  "useWebGL": true,
  "scrollback": 10000,
  "logQuota": {
    "enabled": false,
    "maxFileSizeMB": 10,
    "maxLines": 100000,
    "maxRotatedFiles": 5,
    "stripAnsi": true,
    "logDirectory": "/home/user"
  },
  "macros": [
    {
      "id": "macro-f1",
      "name": "Python Venv Setup",
      "shortcut": "F1",
      "command": "cd ~/project;python -m venv venv",
      "appendNewline": true
    }
  ],
  "quickCommands": [
    {
      "id": "qc-uname",
      "label": "uname -a",
      "command": "uname -a",
      "appendNewline": true
    }
  ],
  "showQuickCommandBar": true,
  "autoCommands": {
    "onNewLocalTab": "",
    "onNewSshTab": "",
    "delayMs": 350
  },
  "sshProfiles": []
}
```
