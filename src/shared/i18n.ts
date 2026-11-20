import { AppLanguage } from './types';

export interface Translations {
  loading: string;
  tabBar: {
    dragHandleTitle: string;
    tabTooltip: string;
    closeTab: string;
    newTab: string;
    splitVertical: string;
    splitHorizontal: string;
    sshManager: string;
    settings: string;
    quickBarToggle: string;
    minimize: string;
    maximize: string;
    closeWindow: string;
  };
  quickBar: {
    dragTitle: string;
    editTitle: string;
    closeTitle: string;
    editorTitle: string;
    addBtn: string;
    labelPlaceholder: string;
    commandPlaceholder: string;
    autoEnter: string;
    saveBtn: string;
    cancelBtn: string;
  };
  terminal: {
    local: string;
    ssh: string;
    sshConnected: string;
    disconnected: string;
    error: string;
    loggingActive: string;
    closePane: string;
  };
  contextMenu: {
    copySelection: string;
    copyAll: string;
    paste: string;
    saveSnapshot: string;
    startContinuousLog: string;
    stopContinuousLog: string;
    splitVertical: string;
    splitHorizontal: string;
    closePane: string;
  };
  sshModal: {
    title: string;
    allCategories: string;
    defaultCategory: string;
    newProfile: string;
    profileName: string;
    profileNamePlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    host: string;
    port: string;
    username: string;
    authType: string;
    authPassword: string;
    authPrivateKey: string;
    authAgent: string;
    passwordHint: string;
    privateKeyPath: string;
    passphrase: string;
    autoCommand: string;
    autoCommandPlaceholder: string;
    cancel: string;
    saveProfile: string;
    emptyList: string;
    connect: string;
    edit: string;
    close: string;
  };
  settingsModal: {
    title: string;
    tabs: {
      appearance: string;
      macros: string;
      autocommands: string;
      logging: string;
      backup: string;
      about: string;
    };
    about: {
      subtitle: string;
      description: string;
      featuresTitle: string;
      features: string[];
      techStack: string;
      repoLabel: string;
    };
    appearance: {
      language: string;
      theme: string;
      fontFamily: string;
      fontSize: string;
      lineHeight: string;
      scrollback: string;
      webgl: string;
      webglEnabled: string;
      webglDisabled: string;
    };
    macros: {
      hint: string;
      addMacro: string;
      namePlaceholder: string;
      shortcutPlaceholder: string;
      commandPlaceholder: string;
      appendNewline: string;
    };
    autoCommands: {
      localLabel: string;
      sshLabel: string;
      delayLabel: string;
    };
    logging: {
      autoStart: string;
      autoStartDisabled: string;
      autoStartEnabled: string;
      stripAnsi: string;
      stripAnsiYes: string;
      stripAnsiNo: string;
      maxSizeMB: string;
      maxLines: string;
      maxRotated: string;
      logDir: string;
    };
    backup: {
      description: string;
      exportBtn: string;
      importBtn: string;
      copyBtn: string;
      previewLabel: string;
      exportedMsg: string;
      importedMsg: string;
      copiedMsg: string;
    };
    savedMsg: string;
    cancel: string;
    save: string;
  };
}

const ZH_TW: Translations = {
  loading: '正在載入 NovaTerm...',
  tabBar: {
    dragHandleTitle: '按住拖曳移動視窗',
    tabTooltip: '雙擊重新命名，拖曳可調整順序',
    closeTab: '關閉分頁',
    newTab: '新增本機分頁 (Ctrl+Shift+T)',
    splitVertical: '垂直分割窗格 (Ctrl+Shift+D)',
    splitHorizontal: '水平分割窗格 (Ctrl+Shift+E)',
    sshManager: 'SSH 連線管理員',
    settings: '設定與主題',
    quickBarToggle: '開啟 / 關閉快速指令懸浮視窗',
    minimize: '最小化',
    maximize: '最大化 / 還原',
    closeWindow: '關閉視窗',
  },
  quickBar: {
    dragTitle: '拖曳移動懸浮視窗',
    editTitle: '編輯快速指令按鈕',
    closeTitle: '關閉懸浮視窗',
    editorTitle: '編輯快速指令',
    addBtn: '新增按鈕',
    labelPlaceholder: '按鈕名稱',
    commandPlaceholder: '指令內容（例如：uname -a）',
    autoEnter: '自動 Enter',
    saveBtn: '儲存',
    cancelBtn: '取消',
  },
  terminal: {
    local: '本機',
    ssh: 'SSH',
    sshConnected: 'SSH 已連線',
    disconnected: '已斷線',
    error: '連線錯誤',
    loggingActive: '持續寫入 Log 中',
    closePane: '關閉窗格 (Ctrl+Shift+W)',
  },
  contextMenu: {
    copySelection: '複製選取文字',
    copyAll: '複製全部終端機內容',
    paste: '貼上',
    saveSnapshot: '存檔 Log（快照）',
    startContinuousLog: '存檔 Log（持續寫入）',
    stopContinuousLog: '停止持續寫入 Log',
    splitVertical: '垂直分割窗格',
    splitHorizontal: '水平分割窗格',
    closePane: '關閉窗格',
  },
  sshModal: {
    title: 'SSH 連線管理員',
    allCategories: '全部',
    defaultCategory: '預設分類',
    newProfile: '新增連線設定',
    profileName: '設定名稱',
    profileNamePlaceholder: '例如：Production Web-01',
    category: '分類',
    categoryPlaceholder: '例如：正式環境 / 測試環境 / HomeLab',
    host: '主機位址 (Host) *',
    port: '連接埠 (Port)',
    username: '使用者名稱 *',
    authType: '驗證方式',
    authPassword: '密碼驗證',
    authPrivateKey: '私鑰檔案 (Private Key)',
    authAgent: 'SSH Agent',
    passwordHint: '密碼（編輯時留白則保留原密碼）',
    privateKeyPath: '私鑰檔案路徑',
    passphrase: '私鑰通行碼（選填）',
    autoCommand: '連線後自動執行指令（選填）',
    autoCommandPlaceholder: '例如：tmux attach || tmux new',
    cancel: '取消',
    saveProfile: '儲存設定',
    emptyList: '此分類尚無 SSH 連線設定，請點擊「新增連線設定」。',
    connect: '連線',
    edit: '編輯',
    close: '關閉',
  },
  settingsModal: {
    title: 'NovaTerm 設定',
    tabs: {
      appearance: '外觀與語言',
      macros: '快捷指令巨集',
      autocommands: '自動執行指令',
      logging: 'Log 額度設定',
      backup: 'JSON 設定與預覽',
      about: '關於 NovaTerm',
    },
    about: {
      subtitle: 'Ubuntu 現代化終端機桌面應用程式 (v1.0.1)',
      description:
        'NovaTerm 是一款專為 Ubuntu 桌面環境設計的現代化終端機模擬器，整合智慧分頁、無限層級分割窗格、內建 SSH 客戶端與工作區狀態記憶，提供高效且可高度自訂的開發維運體驗。',
      featuresTitle: '核心功能特色',
      features: [
        '智慧分頁（新增、雙擊重新命名、拖曳排序）與無限層級水平／垂直分割窗格',
        '內建分類式 SSH 連線管理員，支援密碼（safeStorage 加密）、私鑰與 SSH Agent 驗證',
        '工作區狀態自動記憶與還原（分頁、分割比例、本機工作目錄 CWD）',
        '支援 24-bit True Color 與多組經典配色主題（One Dark, Dracula, Monokai, Solarized Dark, Nord）',
        '右鍵選單複製（無選取時預設複製全終端機內容）、快照存檔與容量／行數自動輪替串流 Log',
        '可調式快速指令懸浮視窗、自訂快捷巨集與 JSON 設定檔匯出／匯入',
      ],
      techStack: '技術架構：Electron • React • TypeScript • xterm.js (WebGL) • @lydell/node-pty • ssh2',
      repoLabel: 'GitHub 專案首頁',
    },
    appearance: {
      language: '介面語言 (Language)',
      theme: '24-bit 色彩主題',
      fontFamily: '終端機字型',
      fontSize: '字體大小 (px)',
      lineHeight: '行高 (Line Height)',
      scrollback: '回捲緩衝行數 (Scrollback)',
      webgl: 'GPU / WebGL 硬體加速渲染',
      webglEnabled: '開啟 (GPU 加速)',
      webglDisabled: '關閉 (預設，CPU/DOM 渲染)',
    },
    macros: {
      hint: '將鍵盤快捷鍵（如 F1、Ctrl+Shift+1、Alt+P）綁定為常用指令。',
      addMacro: '新增快捷指令',
      namePlaceholder: '名稱',
      shortcutPlaceholder: 'F1',
      commandPlaceholder: 'cd ~/project;python -m venv venv',
      appendNewline: '自動換行',
    },
    autoCommands: {
      localLabel: '開啟新本機分頁 / 分割視窗時自動輸入固定指令',
      sshLabel: '開啟新 SSH 連線時預設自動輸入固定指令',
      delayLabel: '啟動延遲時間 (ms)',
    },
    logging: {
      autoStart: '新工作階段自動開啟持續寫入 Log',
      autoStartDisabled: '停用（由右鍵選單手動開啟）',
      autoStartEnabled: '自動啟用',
      stripAnsi: '移除 ANSI 色彩控制碼',
      stripAnsiYes: '是（儲存為純文字）',
      stripAnsiNo: '否（保留原始 ANSI）',
      maxSizeMB: '單一 Log 檔最大容量 (MB) 觸發輪替',
      maxLines: '單一 Log 檔最大行數觸發輪替',
      maxRotated: '保留輪替歷史檔案數量',
      logDir: '預設 Log 儲存資料夾',
    },
    backup: {
      description:
        '可匯出或匯入完整 JSON 設定檔（包含分頁與分割窗格配置、24-bit 主題色彩、快捷指令巨集、自動執行指令、Log 額度與 SSH 設定）。',
      exportBtn: '匯出 JSON 設定檔',
      importBtn: '匯入 JSON 設定檔',
      copyBtn: '複製預覽內容',
      previewLabel: '目前設定 JSON 即時預覽（唯讀）',
      exportedMsg: '已匯出至 ',
      importedMsg: '已成功匯入並套用設定。',
      copiedMsg: '已複製 JSON 設定內容至剪貼簿。',
    },
    savedMsg: '設定已儲存。',
    cancel: '取消',
    save: '儲存設定',
  },
};

const EN: Translations = {
  loading: 'Loading NovaTerm...',
  tabBar: {
    dragHandleTitle: 'Drag to move window',
    tabTooltip: 'Double-click to rename, drag to reorder',
    closeTab: 'Close Tab',
    newTab: 'New Local Tab (Ctrl+Shift+T)',
    splitVertical: 'Split Vertical (Ctrl+Shift+D)',
    splitHorizontal: 'Split Horizontal (Ctrl+Shift+E)',
    sshManager: 'SSH Connection Manager',
    settings: 'Settings & Themes',
    quickBarToggle: 'Toggle Quick Command Bar',
    minimize: 'Minimize',
    maximize: 'Maximize / Restore',
    closeWindow: 'Close Window',
  },
  quickBar: {
    dragTitle: 'Drag floating bar',
    editTitle: 'Edit quick commands',
    closeTitle: 'Close floating bar',
    editorTitle: 'Edit Quick Commands',
    addBtn: 'Add Button',
    labelPlaceholder: 'Label',
    commandPlaceholder: 'Command (e.g. uname -a)',
    autoEnter: 'Auto Enter',
    saveBtn: 'Save',
    cancelBtn: 'Cancel',
  },
  terminal: {
    local: 'Local',
    ssh: 'SSH',
    sshConnected: 'SSH Connected',
    disconnected: 'Disconnected',
    error: 'Error',
    loggingActive: 'Continuous logging active',
    closePane: 'Close Pane (Ctrl+Shift+W)',
  },
  contextMenu: {
    copySelection: 'Copy Selection',
    copyAll: 'Copy Entire Terminal Buffer',
    paste: 'Paste',
    saveSnapshot: 'Save Log (Snapshot)',
    startContinuousLog: 'Save Log (Continuous Stream)',
    stopContinuousLog: 'Stop Continuous Log',
    splitVertical: 'Split Vertical',
    splitHorizontal: 'Split Horizontal',
    closePane: 'Close Pane',
  },
  sshModal: {
    title: 'SSH Connection Manager',
    allCategories: 'All',
    defaultCategory: 'Default',
    newProfile: 'New Profile',
    profileName: 'Profile Name',
    profileNamePlaceholder: 'e.g. Production Web-01',
    category: 'Category',
    categoryPlaceholder: 'e.g. Production / Staging / HomeLab',
    host: 'Host *',
    port: 'Port',
    username: 'Username *',
    authType: 'Auth Type',
    authPassword: 'Password',
    authPrivateKey: 'Private Key',
    authAgent: 'SSH Agent',
    passwordHint: 'Password (leave blank to keep existing)',
    privateKeyPath: 'Private Key Path',
    passphrase: 'Passphrase (optional)',
    autoCommand: 'Auto-run Command on Connect (optional)',
    autoCommandPlaceholder: 'e.g. tmux attach || tmux new',
    cancel: 'Cancel',
    saveProfile: 'Save Profile',
    emptyList: 'No SSH profiles in this category. Click "New Profile" to add one.',
    connect: 'Connect',
    edit: 'Edit',
    close: 'Close',
  },
  settingsModal: {
    title: 'NovaTerm Settings',
    tabs: {
      appearance: 'Appearance & Language',
      macros: 'Key Macros',
      autocommands: 'Auto Commands',
      logging: 'Log Quota',
      backup: 'JSON Config & Preview',
      about: 'About',
    },
    about: {
      subtitle: 'Modern Ubuntu Desktop Terminal Emulator (v1.0.1)',
      description:
        'NovaTerm is a modern terminal emulator crafted for Ubuntu desktops, combining smart tabs, unlimited split panes, a built-in SSH client, and automatic workspace persistence.',
      featuresTitle: 'Core Highlights',
      features: [
        'Smart tabs (add, double-click rename, drag reorder) & unlimited horizontal/vertical split panes',
        'Built-in categorized SSH Connection Manager with encrypted credentials (safeStorage), private key & agent auth',
        'Automatic session & workspace state persistence across restarts (tabs, split ratios, local CWD)',
        '24-bit True Color support with built-in themes (One Dark, Dracula, Monokai, Solarized Dark, Nord)',
        'Right-click copy (full buffer fallback), log snapshots & async streaming logs with MB/line rotation',
        'Resizable floating Quick Command Bar, custom key macros & full JSON config export/import',
      ],
      techStack: 'Tech Stack: Electron • React • TypeScript • xterm.js (WebGL) • @lydell/node-pty • ssh2',
      repoLabel: 'GitHub Repository',
    },
    appearance: {
      language: 'Interface Language',
      theme: '24-bit Color Theme',
      fontFamily: 'Font Family',
      fontSize: 'Font Size (px)',
      lineHeight: 'Line Height',
      scrollback: 'Scrollback Lines',
      webgl: 'GPU / WebGL Hardware Acceleration',
      webglEnabled: 'Enabled (GPU Accelerated)',
      webglDisabled: 'Disabled (Default, CPU/DOM)',
    },
    macros: {
      hint: 'Bind keyboard shortcuts (e.g. F1, Ctrl+Shift+1, Alt+P) to instant commands.',
      addMacro: 'Add Macro',
      namePlaceholder: 'Name',
      shortcutPlaceholder: 'F1',
      commandPlaceholder: 'cd ~/project;python -m venv venv',
      appendNewline: 'Auto Enter',
    },
    autoCommands: {
      localLabel: 'Auto-run Command on New Local Tab / Split Pane',
      sshLabel: 'Global Fallback Auto-run Command on New SSH Connection',
      delayLabel: 'Startup Delay (ms)',
    },
    logging: {
      autoStart: 'Auto-start Continuous Log for New Sessions',
      autoStartDisabled: 'Disabled (Manual via Right-Click)',
      autoStartEnabled: 'Enabled',
      stripAnsi: 'Strip ANSI Escape Codes',
      stripAnsiYes: 'Yes (Clean Plain Text)',
      stripAnsiNo: 'No (Keep Raw ANSI)',
      maxSizeMB: 'Max File Size (MB) Before Rotation',
      maxLines: 'Max Lines Before Rotation',
      maxRotated: 'Max Rotated Archive Files',
      logDir: 'Default Log Directory',
    },
    backup: {
      description:
        'Export or import a complete JSON configuration bundle containing tabs & split-pane layouts, 24-bit themes, key macros, auto-run commands, log quotas, and SSH profiles.',
      exportBtn: 'Export JSON Config',
      importBtn: 'Import JSON Config',
      copyBtn: 'Copy Preview JSON',
      previewLabel: 'Live JSON Config Preview (Read-only)',
      exportedMsg: 'Exported to ',
      importedMsg: 'Configuration imported and applied.',
      copiedMsg: 'JSON config copied to clipboard.',
    },
    savedMsg: 'Settings saved.',
    cancel: 'Cancel',
    save: 'Save Settings',
  },
};

export function getTranslations(language: AppLanguage | undefined): Translations {
  return language === 'en' ? EN : ZH_TW;
}
