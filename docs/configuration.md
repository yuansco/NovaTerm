# Configuration & Backup Guide

## Data Storage Locations

On Ubuntu, Electron stores NovaTerm's persistent files under `~/.config/nova-term/`:

- `config.json`: Themes, font settings, key macros, auto-run commands, log quotas, and SSH profiles (with encrypted credentials).
- `workspace-state.json`: Saved tabs, binary split-pane tree layout & ratios, active pane IDs, and local working directories (`CWD`).
- `logs/`: Default directory for continuous session logs and rotated archives (`session.log`, `session.log.1`, ...).

## Exporting & Restoring Backup JSON

1. Open **Settings** -> **JSON Export / Import**.
2. Click **Export JSON Config** to save a single `.json` backup file containing:
   - `themeId`, `customThemes`, `fontFamily`, `fontSize`, `lineHeight`, `useWebGL`
   - `macros` (custom shortcut commands)
   - `autoCommands` (local & SSH startup commands)
   - `logQuota` (max MB, max lines, max rotated files, ANSI stripping)
   - `sshProfiles`
   - `workspaceSnapshot` (all tabs, split pane trees, ratios, and CWDs)
3. To restore on another machine or after a reset, click **Import JSON Config** and select your `.json` backup file. NovaTerm immediately applies the settings and restores the workspace layout.

## Example `novaterm-config.json`

```json
{
  "version": 1,
  "themeId": "dracula",
  "fontFamily": "\"JetBrains Mono\", \"Ubuntu Mono\", monospace",
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
    "logDirectory": "/home/user/.config/nova-term/logs"
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
  "autoCommands": {
    "onNewLocalTab": "",
    "onNewSshTab": "",
    "delayMs": 350
  },
  "sshProfiles": []
}
```
