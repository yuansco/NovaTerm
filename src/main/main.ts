import { app, BrowserWindow, dialog, ipcMain, safeStorage } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  AppConfig,
  CreateSessionPayload,
  IPC_CHANNELS,
  PaneNode,
  SshProfile,
  WorkspaceState,
} from '../shared/types';
import { LogRecorder } from './logging/LogRecorder';
import { SessionManager } from './session/SessionManager';
import { ConfigStore, createElectronSecretCipher } from './store/ConfigStore';

let mainWindow: BrowserWindow | null = null;
let configStore: ConfigStore;
let sessionManager: SessionManager;
let isQuitting = false;

function resolveDefaultLogDir(): string {
  const configured = configStore.getConfig().logQuota.logDirectory?.trim();
  if (configured && fs.existsSync(configured)) {
    return configured;
  }
  return os.homedir();
}

function resolveUniqueLogFilePath(dir: string, date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const baseName = `log_${yyyy}${mm}${dd}`;

  const primary = path.join(dir, `${baseName}.txt`);
  if (!fs.existsSync(primary)) {
    return primary;
  }

  let index = 1;
  while (true) {
    const candidate = path.join(dir, `${baseName}-${index}.txt`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
    index++;
  }
}

function refreshWorkspaceCwds(node: PaneNode, manager: SessionManager): PaneNode {
  if (node.kind === 'leaf') {
    if (node.sessionConfig.type === 'local') {
      const liveCwd = manager.getSessionCwd(node.id);
      if (liveCwd) {
        return {
          ...node,
          sessionConfig: {
            ...node.sessionConfig,
            cwd: liveCwd,
          },
        };
      }
    }
    return node;
  }
  return {
    ...node,
    first: refreshWorkspaceCwds(node.first, manager),
    second: refreshWorkspaceCwds(node.second, manager),
  };
}

function createWindow(): void {
  const savedState = configStore.getWorkspaceState();
  const bounds = savedState.windowBounds;

  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 720,
    minHeight: 480,
    icon: path.join(__dirname, '../../assets/icon.png'),
    frame: false,
    backgroundColor: '#1e2127',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (bounds?.isMaximized) {
    mainWindow.maximize();
  }

  const rendererHtml = path.join(__dirname, '../renderer/index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(rendererHtml)) {
    void mainWindow.loadFile(rendererHtml);
  } else {
    void mainWindow.loadURL('http://localhost:5173');
  }

  const persistWindowBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const current = configStore.getWorkspaceState();
    const isMaximized = mainWindow.isMaximized();
    const rect = mainWindow.getNormalBounds();
    configStore.saveWorkspaceState({
      ...current,
      windowBounds: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        isMaximized,
      },
    });
  };

  mainWindow.on('resize', persistWindowBounds);
  mainWindow.on('move', persistWindowBounds);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.SESSION_CREATE,
    (_event, payload: CreateSessionPayload) => {
      sessionManager.createSession(payload);
    },
  );

  ipcMain.on(IPC_CHANNELS.SESSION_WRITE, (_event, paneId: string, data: string) => {
    sessionManager.writeToSession(paneId, data);
  });

  ipcMain.on(
    IPC_CHANNELS.SESSION_RESIZE,
    (_event, paneId: string, cols: number, rows: number) => {
      sessionManager.resizeSession(paneId, cols, rows);
    },
  );

  ipcMain.handle(IPC_CHANNELS.SESSION_CLOSE, async (_event, paneId: string) => {
    await sessionManager.closeSession(paneId);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_CWD, (_event, paneId: string) => {
    return sessionManager.getSessionCwd(paneId);
  });

  ipcMain.handle(IPC_CHANNELS.LOG_START, async (_event, paneId: string) => {
    if (!mainWindow) return null;
    const defaultDir = resolveDefaultLogDir();
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '開始持續寫入 Log / Start Continuous Log',
      defaultPath: resolveUniqueLogFilePath(defaultDir),
      filters: [
        { name: 'Text / Log Files', extensions: ['txt', 'log'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    return sessionManager.startContinuousLog(paneId, result.filePath);
  });

  ipcMain.handle(IPC_CHANNELS.LOG_STOP, async (_event, paneId: string) => {
    await sessionManager.stopContinuousLog(paneId);
  });

  ipcMain.handle(
    IPC_CHANNELS.LOG_SAVE_SNAPSHOT,
    async (_event, _paneId: string, content: string) => {
      if (!mainWindow) return null;
      const defaultDir = resolveDefaultLogDir();
      const result = await dialog.showSaveDialog(mainWindow, {
        title: '儲存終端機 Log / Save Terminal Log',
        defaultPath: resolveUniqueLogFilePath(defaultDir),
        filters: [
          { name: 'Text / Log Files', extensions: ['txt', 'log'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (result.canceled || !result.filePath) {
        return null;
      }
      await LogRecorder.saveSnapshot(
        result.filePath,
        content,
        configStore.getConfig().logQuota.stripAnsi,
      );
      return { filePath: result.filePath };
    },
  );

  ipcMain.handle(IPC_CHANNELS.LOG_GET_STATUS, (_event, paneId: string) => {
    return sessionManager.isLogging(paneId);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_LOAD, () => {
    return configStore.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SAVE, (_event, nextConfig: AppConfig) => {
    const saved = configStore.saveConfig(nextConfig);
    sessionManager.updateLogQuota(saved.logQuota);
    return saved;
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_EXPORT, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export NovaTerm Configuration',
      defaultPath: path.join(app.getPath('documents'), 'novaterm-config.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    const json = configStore.exportConfigJson();
    await fs.promises.writeFile(result.filePath, json, 'utf8');
    return { filePath: result.filePath };
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_IMPORT, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import NovaTerm Configuration',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const raw = await fs.promises.readFile(result.filePaths[0], 'utf8');
    const imported = configStore.importConfigJson(raw);
    sessionManager.updateLogQuota(imported.config.logQuota);
    return imported;
  });

  ipcMain.handle(IPC_CHANNELS.STATE_LOAD, () => {
    return configStore.getWorkspaceState();
  });

  ipcMain.handle(IPC_CHANNELS.STATE_SAVE, (_event, state: WorkspaceState) => {
    const updatedTabs = state.tabs.map((tab) => ({
      ...tab,
      rootPane: refreshWorkspaceCwds(tab.rootPane, sessionManager),
    }));
    configStore.saveWorkspaceState({
      ...state,
      tabs: updatedTabs,
    });
  });

  ipcMain.handle(IPC_CHANNELS.SSH_LIST, () => {
    return configStore.listSshProfiles();
  });

  ipcMain.handle(IPC_CHANNELS.SSH_UPSERT, (_event, profile: SshProfile) => {
    return configStore.upsertSshProfile(profile);
  });

  ipcMain.handle(IPC_CHANNELS.SSH_DELETE, (_event, profileId: string) => {
    return configStore.deleteSshProfile(profileId);
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_PICK_KEY_FILE, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select SSH Private Key',
      properties: ['openFile', 'showHiddenFiles'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });
}

function ensureLinuxDesktopEntry(): void {
  if (process.platform !== 'linux') return;
    const iconSrc = path.join(__dirname, '../../assets/icon.png');
    const appsDir = path.join(os.homedir(), '.local/share/applications');
    const iconsDir = path.join(os.homedir(), '.local/share/icons');
    const systemDesktop = '/usr/share/applications/novaterm.desktop';

    if (!fs.existsSync(systemDesktop) && fs.existsSync(iconSrc)) {
      try {
        fs.mkdirSync(appsDir, { recursive: true });
        fs.mkdirSync(iconsDir, { recursive: true });
        const userIconPath = path.join(iconsDir, 'novaterm.png');
        fs.writeFileSync(userIconPath, fs.readFileSync(iconSrc));

        const execPath = process.execPath.endsWith('.bin')
          ? process.execPath.slice(0, -4)
          : process.execPath;
        const desktopEntry = [
          '[Desktop Entry]',
          'Name=NovaTerm',
          'Comment=Modern Ubuntu Desktop Terminal Emulator',
          `Exec="${execPath}" %U`,
          `Icon=${userIconPath}`,
          'Terminal=false',
          'Type=Application',
          'Categories=System;TerminalEmulator;',
          'StartupWMClass=novaterm',
          '',
        ].join('\n');
        fs.writeFileSync(path.join(appsDir, 'novaterm.desktop'), desktopEntry, 'utf8');
      } catch {
        // Ignore desktop entry registration errors
      }
    }
}

if (process.platform === 'linux') {
  app.setName('novaterm');
  const appWithDesktopName = app as unknown as { setDesktopName?: (name: string) => void };
  appWithDesktopName.setDesktopName?.('novaterm.desktop');
}

void app.whenReady().then(() => {
  ensureLinuxDesktopEntry();
  const userDataDir = app.getPath('userData');
  configStore = new ConfigStore(userDataDir, createElectronSecretCipher(safeStorage));

  sessionManager = new SessionManager(configStore, {
    onData: (event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.SESSION_DATA, event);
      }
    },
    onStatus: (event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.SESSION_STATUS, event);
      }
    },
    onCwd: (event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.SESSION_CWD, event);
      }
    },
  });

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', (event) => {
  if (isQuitting) {
    return;
  }
  event.preventDefault();
  isQuitting = true;

  const current = configStore.getWorkspaceState();
  const updatedTabs = current.tabs.map((tab) => ({
    ...tab,
    rootPane: refreshWorkspaceCwds(tab.rootPane, sessionManager),
  }));
  configStore.saveWorkspaceState({
    ...current,
    tabs: updatedTabs,
  });

  void sessionManager.closeAll().finally(() => {
    app.exit(0);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
