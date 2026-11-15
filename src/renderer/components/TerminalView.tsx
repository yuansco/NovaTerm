import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { X } from 'lucide-react';
import { Translations } from '../../shared/i18n';
import {
  AppConfig,
  KeyMacro,
  PaneLeafNode,
  SplitDirection,
  ThemeSchema,
} from '../../shared/types';
import { ContextMenu } from './ContextMenu';

interface TerminalViewProps {
  t: Translations;
  pane: PaneLeafNode;
  isActive: boolean;
  isTabVisible: boolean;
  config: AppConfig;
  theme: ThemeSchema;
  onFocus: () => void;
  onSplit: (direction: SplitDirection) => void;
  onClosePane: () => void;
  onLoggingChange: (isLogging: boolean) => void;
}

function extractFullTerminalBuffer(term: Terminal): string {
  const buffer = term.buffer.active;
  const lines: string[] = [];
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i);
    if (line) {
      lines.push(line.translateToString(true));
    }
  }
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n');
}

function formatKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  let key = e.key;
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key);
  }
  return parts.join('+');
}

interface CachedTerminal {
  term: Terminal;
  fitAddon: FitAddon;
  wrapperEl: HTMLDivElement;
  sessionState: 'idle' | 'connected' | 'disconnected' | 'error';
  onStatusChange?: (state: 'idle' | 'connected' | 'disconnected' | 'error') => void;
  dispose: () => void;
}

const terminalCache = new Map<string, CachedTerminal>();

export function disposeTerminalInstance(paneId: string): void {
  const cached = terminalCache.get(paneId);
  if (!cached) return;
  terminalCache.delete(paneId);
  cached.dispose();
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  t,
  pane,
  isActive,
  isTabVisible,
  config,
  theme,
  onFocus,
  onSplit,
  onClosePane,
  onLoggingChange,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const macrosRef = useRef<KeyMacro[]>(config.macros);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [sessionState, setSessionState] = useState<'idle' | 'connected' | 'disconnected' | 'error'>(
    () => terminalCache.get(pane.id)?.sessionState ?? 'idle',
  );

  const statusLabel =
    sessionState === 'connected'
      ? pane.sessionConfig.type === 'ssh'
        ? t.terminal.sshConnected
        : t.terminal.local
      : sessionState === 'disconnected'
        ? t.terminal.disconnected
        : sessionState === 'error'
          ? t.terminal.error
          : pane.sessionConfig.type === 'ssh'
            ? t.terminal.ssh
            : t.terminal.local;

  macrosRef.current = config.macros;

  const handleCopy = useCallback(() => {
    const term = termRef.current;
    if (!term) return;
    const text = term.hasSelection()
      ? term.getSelection()
      : extractFullTerminalBuffer(term);
    if (text) {
      void navigator.clipboard.writeText(text);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        window.novaTerm.session.write(pane.id, text);
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err);
    }
  }, [pane.id]);

  const handleSaveSnapshot = useCallback(async () => {
    const term = termRef.current;
    if (!term) return;
    const fullText = extractFullTerminalBuffer(term);
    await window.novaTerm.log.saveSnapshot(pane.id, fullText);
  }, [pane.id]);

  const handleToggleContinuousLog = useCallback(async () => {
    if (pane.isLogging) {
      await window.novaTerm.log.stopContinuous(pane.id);
      onLoggingChange(false);
    } else {
      const res = await window.novaTerm.log.startContinuous(pane.id);
      if (res) {
        onLoggingChange(true);
      }
    }
  }, [pane.id, pane.isLogging, onLoggingChange]);

  // Mount xterm.js (or re-attach cached instance on split-pane tree restructure)
  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cached = terminalCache.get(pane.id);

    if (!cached) {
      const wrapperEl = document.createElement('div');
      wrapperEl.style.width = '100%';
      wrapperEl.style.height = '100%';

      const term = new Terminal({
        allowProposedApi: true,
        cursorBlink: true,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        scrollback: config.scrollback,
        theme: theme.terminal,
      });

      const fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(webLinksAddon);

      container.appendChild(wrapperEl);
      term.open(wrapperEl);

      if (config.useWebGL) {
        try {
          const webglAddon = new WebglAddon();
          webglAddon.onContextLoss(() => {
            webglAddon.dispose();
          });
          term.loadAddon(webglAddon);
        } catch {
          // Fallback to standard canvas/DOM renderer
        }
      }

      fitAddon.fit();

      term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.type !== 'keydown') return true;

        if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'C') {
          e.preventDefault();
          handleCopy();
          return false;
        }
        if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'V') {
          e.preventDefault();
          void handlePaste();
          return false;
        }

        const combo = formatKeyCombo(e);
        const matchedMacro = macrosRef.current.find(
          (m) => m.shortcut.toLowerCase() === combo.toLowerCase(),
        );
        if (matchedMacro) {
          e.preventDefault();
          const normalized = matchedMacro.command.replace(/\r\n/g, '\r').replace(/\n/g, '\r');
          const suffix = matchedMacro.appendNewline ? '\r' : '';
          window.novaTerm.session.write(pane.id, `${normalized}${suffix}`);
          return false;
        }

        return true;
      });

      const newCached: CachedTerminal = {
        term,
        fitAddon,
        wrapperEl,
        sessionState: 'idle',
        dispose: () => {},
      };

      const unsubscribeData = window.novaTerm.session.onData((event) => {
        if (event.paneId === pane.id) {
          term.write(event.data);
        }
      });

      const unsubscribeStatus = window.novaTerm.session.onStatus((event) => {
        if (event.paneId === pane.id) {
          const nextState =
            event.status === 'connected'
              ? 'connected'
              : event.status === 'disconnected'
                ? 'disconnected'
                : 'error';
          newCached.sessionState = nextState;
          newCached.onStatusChange?.(nextState);
        }
      });

      const disposeInput = term.onData((data) => {
        window.novaTerm.session.write(pane.id, data);
      });

      newCached.dispose = () => {
        disposeInput.dispose();
        unsubscribeData();
        unsubscribeStatus();
        term.dispose();
        wrapperEl.remove();
      };

      terminalCache.set(pane.id, newCached);
      cached = newCached;

      void window.novaTerm.session.create({
        paneId: pane.id,
        cols: term.cols,
        rows: term.rows,
        config: pane.sessionConfig,
      });

      void window.novaTerm.log.getStatus(pane.id).then((active) => {
        onLoggingChange(active);
      });
    } else {
      container.appendChild(cached.wrapperEl);
      cached.fitAddon.fit();
      window.novaTerm.session.resize(pane.id, cached.term.cols, cached.term.rows);
    }

    termRef.current = cached.term;
    fitAddonRef.current = cached.fitAddon;
    cached.onStatusChange = setSessionState;
    setSessionState(cached.sessionState);

    const resizeObserver = new ResizeObserver(() => {
      try {
        cached!.fitAddon.fit();
        window.novaTerm.session.resize(pane.id, cached!.term.cols, cached!.term.rows);
      } catch {
        // Ignore transient resize errors while hidden
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (cached) {
        cached.onStatusChange = undefined;
      }
      termRef.current = null;
      fitAddonRef.current = null;
    };
    // Intentionally mount/reattach session per pane.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pane.id]);

  // Dynamic 24-bit theme & font updates without recreating session
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = theme.terminal;
    term.options.fontFamily = config.fontFamily;
    term.options.fontSize = config.fontSize;
    term.options.lineHeight = config.lineHeight;
    term.options.scrollback = config.scrollback;
    fitAddonRef.current?.fit();
    window.novaTerm.session.resize(pane.id, term.cols, term.rows);
  }, [theme, config, pane.id]);

  // Focus & refit when pane or tab becomes active
  useEffect(() => {
    if (isActive && isTabVisible) {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        termRef.current?.focus();
      });
    }
  }, [isActive, isTabVisible]);

  // Restore focus when explicitly requested (e.g. after clicking Quick Command Bar)
  useEffect(() => {
    const handleFocusPane = (event: Event) => {
      const customEvent = event as CustomEvent<{ paneId?: string }>;
      if (customEvent.detail?.paneId === pane.id) {
        requestAnimationFrame(() => {
          termRef.current?.focus();
        });
      }
    };
    window.addEventListener('novaterm:focus-pane', handleFocusPane);
    return () => {
      window.removeEventListener('novaterm:focus-pane', handleFocusPane);
    };
  }, [pane.id]);

  return (
    <div
      className={`terminal-pane ${isActive ? 'active' : ''}`}
      onMouseDown={onFocus}
      onContextMenu={(e) => {
        e.preventDefault();
        onFocus();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="terminal-pane-header">
        <span className="terminal-pane-badge">
          {pane.isLogging && (
            <span className="logging-dot" title={t.terminal.loggingActive} />
          )}
          <span>{pane.title}</span>
          <span>•</span>
          <span>{statusLabel}</span>
        </span>
        <button
          className="icon-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            onClosePane();
          }}
          title={t.terminal.closePane}
          style={{ padding: 2 }}
        >
          <X size={11} />
        </button>
      </div>

      <div ref={hostRef} className="terminal-xterm-host" />

      {contextMenu && (
        <ContextMenu
          t={t}
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={Boolean(termRef.current?.hasSelection())}
          isLogging={Boolean(pane.isLogging)}
          onCopy={handleCopy}
          onPaste={() => void handlePaste()}
          onSaveSnapshot={() => void handleSaveSnapshot()}
          onToggleContinuousLog={() => void handleToggleContinuousLog()}
          onSplit={onSplit}
          onClosePane={onClosePane}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
