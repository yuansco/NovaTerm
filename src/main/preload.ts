import { contextBridge, ipcRenderer } from 'electron';
import {
  AppConfig,
  CreateSessionPayload,
  IPC_CHANNELS,
  SessionCwdEvent,
  SessionDataEvent,
  SessionStatusEvent,
  SshProfile,
  WorkspaceState,
} from '../shared/types';

export interface NovaTermApi {
  session: {
    create(payload: CreateSessionPayload): Promise<void>;
    write(paneId: string, data: string): void;
    resize(paneId: string, cols: number, rows: number): void;
    close(paneId: string): Promise<void>;
    getCwd(paneId: string): Promise<string | undefined>;
    onData(callback: (event: SessionDataEvent) => void): () => void;
    onData(paneId: string, callback: (data: string) => void): () => void;
    onStatus(callback: (event: SessionStatusEvent) => void): () => void;
    onCwd(callback: (event: SessionCwdEvent) => void): () => void;
  };
  log: {
    startContinuous(paneId: string): Promise<{ filePath: string } | null>;
    stopContinuous(paneId: string): Promise<void>;
    saveSnapshot(paneId: string, content: string): Promise<{ filePath: string } | null>;
    getStatus(paneId: string): Promise<boolean>;
  };
  config: {
    load(): Promise<AppConfig>;
    save(config: AppConfig): Promise<AppConfig>;
    exportJson(): Promise<{ filePath: string } | null>;
    importJson(): Promise<{ config: AppConfig; workspaceState: WorkspaceState } | null>;
  };
  state: {
    load(): Promise<WorkspaceState>;
    save(state: WorkspaceState): Promise<void>;
  };
  ssh: {
    list(): Promise<SshProfile[]>;
    upsert(profile: SshProfile): Promise<SshProfile[]>;
    delete(profileId: string): Promise<SshProfile[]>;
  };
  dialog: {
    pickKeyFile(): Promise<string | null>;
  };
  windowControls: {
    minimize(): void;
    maximize(): void;
    close(): void;
  };
}

const paneDataListeners = new Map<string, Set<(data: string) => void>>();
const globalDataListeners = new Set<(event: SessionDataEvent) => void>();

ipcRenderer.on(IPC_CHANNELS.SESSION_DATA, (_: Electron.IpcRendererEvent, event: SessionDataEvent) => {
  const paneListeners = paneDataListeners.get(event.paneId);
  if (paneListeners && paneListeners.size > 0) {
    for (const cb of paneListeners) {
      cb(event.data);
    }
  }
  if (globalDataListeners.size > 0) {
    for (const cb of globalDataListeners) {
      cb(event);
    }
  }
});

const api: NovaTermApi = {
  session: {
    create: (payload) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, payload),
    write: (paneId, data) => ipcRenderer.send(IPC_CHANNELS.SESSION_WRITE, paneId, data),
    resize: (paneId, cols, rows) =>
      ipcRenderer.send(IPC_CHANNELS.SESSION_RESIZE, paneId, cols, rows),
    close: (paneId) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_CLOSE, paneId),
    getCwd: (paneId) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_CWD, paneId),
    onData: ((
      arg1: string | ((event: SessionDataEvent) => void),
      arg2?: (data: string) => void,
    ) => {
      if (typeof arg1 === 'string' && typeof arg2 === 'function') {
        const paneId = arg1;
        const cb = arg2;
        let listeners = paneDataListeners.get(paneId);
        if (!listeners) {
          listeners = new Set();
          paneDataListeners.set(paneId, listeners);
        }
        listeners.add(cb);
        return () => {
          listeners.delete(cb);
          if (listeners.size === 0) {
            paneDataListeners.delete(paneId);
          }
        };
      } else if (typeof arg1 === 'function') {
        const cb = arg1;
        globalDataListeners.add(cb);
        return () => {
          globalDataListeners.delete(cb);
        };
      }
      return () => {};
    }) as {
      (callback: (event: SessionDataEvent) => void): () => void;
      (paneId: string, callback: (data: string) => void): () => void;
    },
    onStatus: (callback) => {
      const listener = (_: Electron.IpcRendererEvent, event: SessionStatusEvent) =>
        callback(event);
      ipcRenderer.on(IPC_CHANNELS.SESSION_STATUS, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SESSION_STATUS, listener);
    },
    onCwd: (callback) => {
      const listener = (_: Electron.IpcRendererEvent, event: SessionCwdEvent) =>
        callback(event);
      ipcRenderer.on(IPC_CHANNELS.SESSION_CWD, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SESSION_CWD, listener);
    },
  },
  log: {
    startContinuous: (paneId) => ipcRenderer.invoke(IPC_CHANNELS.LOG_START, paneId),
    stopContinuous: (paneId) => ipcRenderer.invoke(IPC_CHANNELS.LOG_STOP, paneId),
    saveSnapshot: (paneId, content) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOG_SAVE_SNAPSHOT, paneId, content),
    getStatus: (paneId) => ipcRenderer.invoke(IPC_CHANNELS.LOG_GET_STATUS, paneId),
  },
  config: {
    load: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_LOAD),
    save: (config) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE, config),
    exportJson: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_EXPORT),
    importJson: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_IMPORT),
  },
  state: {
    load: () => ipcRenderer.invoke(IPC_CHANNELS.STATE_LOAD),
    save: (state) => ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE, state),
  },
  ssh: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.SSH_LIST),
    upsert: (profile) => ipcRenderer.invoke(IPC_CHANNELS.SSH_UPSERT, profile),
    delete: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.SSH_DELETE, profileId),
  },
  dialog: {
    pickKeyFile: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_PICK_KEY_FILE),
  },
  windowControls: {
    minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  },
};

contextBridge.exposeInMainWorld('novaTerm', api);
