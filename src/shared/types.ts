export type SplitDirection = 'horizontal' | 'vertical';

export type SessionType = 'local' | 'ssh';

export interface PaneSessionConfig {
  type: SessionType;
  cwd?: string;
  shell?: string;
  sshProfileId?: string;
  autoCommand?: string;
}

export interface PaneLeafNode {
  kind: 'leaf';
  id: string;
  title: string;
  sessionConfig: PaneSessionConfig;
  isLogging?: boolean;
}

export interface PaneSplitNode {
  kind: 'split';
  id: string;
  direction: SplitDirection;
  /** Ratio (0.1 to 0.9) allocated to the `first` child */
  ratio: number;
  first: PaneNode;
  second: PaneNode;
}

export type PaneNode = PaneLeafNode | PaneSplitNode;

export interface TabState {
  id: string;
  title: string;
  isCustomTitle?: boolean;
  rootPane: PaneNode;
  activePaneId: string;
}

export type SshAuthType = 'password' | 'privateKey' | 'agent';

export interface SshProfile {
  id: string;
  name: string;
  category: string;
  host: string;
  port: number;
  username: string;
  authType: SshAuthType;
  /** Base64-encoded ciphertext encrypted with Electron safeStorage */
  encryptedPassword?: string;
  /** Optional plaintext password used only in memory / transient save requests */
  password?: string;
  privateKeyPath?: string;
  encryptedPassphrase?: string;
  passphrase?: string;
  autoCommand?: string;
  keepAliveIntervalMs?: number;
}

export interface TerminalColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent?: string;
  selectionBackground: string;
  selectionForeground?: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface UiThemeColors {
  windowBg: string;
  tabBarBg: string;
  tabActiveBg: string;
  tabHoverBg: string;
  surfaceBg: string;
  borderColor: string;
  splitterColor: string;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
  dangerColor: string;
  successColor: string;
}

export interface ThemeSchema {
  id: string;
  name: string;
  isDark: boolean;
  ui: UiThemeColors;
  terminal: TerminalColors;
  customCss?: string;
}

export interface LogQuotaConfig {
  enabled: boolean;
  /** Maximum size per log file in MB before rotation */
  maxFileSizeMB: number;
  /** Maximum line count per log file before rotation */
  maxLines: number;
  /** Maximum number of rotated archive files to retain per session */
  maxRotatedFiles: number;
  /** Strip ANSI escape sequences before writing to disk */
  stripAnsi: boolean;
  /** Directory where continuous logs are stored */
  logDirectory: string;
}

export interface KeyMacro {
  id: string;
  name: string;
  /** Key combo string, e.g. "F1", "Ctrl+Shift+1", "Alt+P" */
  shortcut: string;
  command: string;
  appendNewline: boolean;
}

export interface QuickCommandItem {
  id: string;
  label: string;
  command: string;
  appendNewline: boolean;
}

export interface AutoCommandConfig {
  onNewLocalTab: string;
  onNewSshTab: string;
  delayMs: number;
}

export interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

export interface WorkspaceState {
  tabs: TabState[];
  activeTabId: string;
  windowBounds?: WindowBounds;
}

export type AppLanguage = 'zh-TW' | 'en';

export interface AppConfig {
  version: number;
  language: AppLanguage;
  themeId: string;
  customThemes: ThemeSchema[];
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  useWebGL: boolean;
  scrollback: number;
  logQuota: LogQuotaConfig;
  macros: KeyMacro[];
  quickCommands?: QuickCommandItem[];
  showQuickCommandBar?: boolean;
  autoCommands: AutoCommandConfig;
  sshProfiles: SshProfile[];
  /** Included during JSON export/import for full workspace backup */
  workspaceSnapshot?: WorkspaceState;
}

export interface CreateSessionPayload {
  paneId: string;
  cols: number;
  rows: number;
  config: PaneSessionConfig;
}

export interface SessionDataEvent {
  paneId: string;
  data: string;
}

export interface SessionStatusEvent {
  paneId: string;
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
  exitCode?: number;
}

export interface SessionCwdEvent {
  paneId: string;
  cwd: string;
}

export const IPC_CHANNELS = {
  SESSION_CREATE: 'session:create',
  SESSION_WRITE: 'session:write',
  SESSION_RESIZE: 'session:resize',
  SESSION_CLOSE: 'session:close',
  SESSION_GET_CWD: 'session:get-cwd',
  SESSION_DATA: 'session:data',
  SESSION_STATUS: 'session:status',
  SESSION_CWD: 'session:cwd',

  LOG_START: 'log:start',
  LOG_STOP: 'log:stop',
  LOG_SAVE_SNAPSHOT: 'log:save-snapshot',
  LOG_GET_STATUS: 'log:get-status',

  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE: 'config:save',
  CONFIG_EXPORT: 'config:export',
  CONFIG_IMPORT: 'config:import',

  STATE_LOAD: 'state:load',
  STATE_SAVE: 'state:save',

  SSH_LIST: 'ssh:list',
  SSH_UPSERT: 'ssh:upsert',
  SSH_DELETE: 'ssh:delete',

  DIALOG_PICK_KEY_FILE: 'dialog:pick-key-file',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;
