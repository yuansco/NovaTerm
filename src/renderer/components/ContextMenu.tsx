import React, { useEffect, useRef } from 'react';
import { Translations } from '../../shared/i18n';
import { SplitDirection } from '../../shared/types';

interface ContextMenuProps {
  t: Translations;
  x: number;
  y: number;
  hasSelection: boolean;
  isLogging: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onSaveSnapshot: () => void;
  onToggleContinuousLog: () => void;
  onSplit: (direction: SplitDirection) => void;
  onClosePane: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  t,
  x,
  y,
  hasSelection,
  isLogging,
  onCopy,
  onPaste,
  onSaveSnapshot,
  onToggleContinuousLog,
  onSplit,
  onClosePane,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 230);
  const top = Math.min(y, window.innerHeight - 280);

  return (
    <div ref={menuRef} className="context-menu" style={{ left, top }}>
      <button
        className="context-menu-item"
        onClick={() => {
          onCopy();
          onClose();
        }}
      >
        <span>{hasSelection ? t.contextMenu.copySelection : t.contextMenu.copyAll}</span>
        <span>Ctrl+Shift+C</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onPaste();
          onClose();
        }}
      >
        <span>{t.contextMenu.paste}</span>
        <span>Ctrl+Shift+V</span>
      </button>

      <div className="context-menu-divider" />

      <button
        className="context-menu-item"
        onClick={() => {
          onSaveSnapshot();
          onClose();
        }}
      >
        <span>{t.contextMenu.saveSnapshot}</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onToggleContinuousLog();
          onClose();
        }}
      >
        <span>
          {isLogging ? t.contextMenu.stopContinuousLog : t.contextMenu.startContinuousLog}
        </span>
      </button>

      <div className="context-menu-divider" />

      <button
        className="context-menu-item"
        onClick={() => {
          onSplit('vertical');
          onClose();
        }}
      >
        <span>{t.contextMenu.splitVertical}</span>
        <span>Ctrl+Shift+D</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onSplit('horizontal');
          onClose();
        }}
      >
        <span>{t.contextMenu.splitHorizontal}</span>
        <span>Ctrl+Shift+E</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onClosePane();
          onClose();
        }}
      >
        <span>{t.contextMenu.closePane}</span>
        <span>Ctrl+Shift+W</span>
      </button>
    </div>
  );
};
