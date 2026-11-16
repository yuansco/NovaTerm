import React, { useState } from 'react';
import {
  Columns,
  GripVertical,
  Minus,
  Plus,
  Rows,
  Server,
  Settings,
  Square,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { Translations } from '../../shared/i18n';
import { SplitDirection, TabState } from '../../shared/types';

interface TabBarProps {
  t: Translations;
  tabs: TabState[];
  activeTabId: string;
  fontSize?: number;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onRenameTab: (tabId: string, title: string) => void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
  onSplitPane: (direction: SplitDirection) => void;
  isQuickBarOpen: boolean;
  onToggleQuickBar: () => void;
  onOpenSshManager: () => void;
  onOpenSettings: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  t,
  tabs,
  activeTabId,
  fontSize,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onReorderTabs,
  onSplitPane,
  isQuickBarOpen,
  onToggleQuickBar,
  onOpenSshManager,
  onOpenSettings,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const baseFontSize = fontSize ?? 14;
  const tabIconSize = Math.max(13, Math.min(22, Math.round(baseFontSize * 0.95)));
  const tabCloseSize = Math.max(12, Math.min(20, Math.round(baseFontSize * 0.85)));
  const actionIconSize = Math.max(14, Math.min(22, Math.round(baseFontSize * 1.0)));
  const windowIconSize = Math.max(13, Math.min(20, Math.round(baseFontSize * 0.9)));
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const commitRename = (tabId: string) => {
    if (draftTitle.trim()) {
      onRenameTab(tabId, draftTitle);
    }
    setEditingTabId(null);
  };

  return (
    <header className="tab-bar">
      <div className="tab-drag-handle" title={t.tabBar.dragHandleTitle}>
        <GripVertical size={13} />
        <span>NovaTerm</span>
      </div>
      <div className="tab-list">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingTabId === tab.id;
          return (
            <div
              key={tab.id}
              className={`tab-item ${isActive ? 'active' : ''}`}
              draggable={!isEditing}
              onDragStart={(e) => {
                setDragIndex(index);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from =
                  dragIndex !== null
                    ? dragIndex
                    : Number(e.dataTransfer.getData('text/plain'));
                if (!Number.isNaN(from) && from !== index) {
                  onReorderTabs(from, index);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              onClick={() => onSelectTab(tab.id)}
              onDoubleClick={() => {
                setEditingTabId(tab.id);
                setDraftTitle(tab.title);
              }}
              title={t.tabBar.tabTooltip}
            >
              <Terminal size={tabIconSize} />
              {isEditing ? (
                <input
                  className="tab-rename-input"
                  value={draftTitle}
                  autoFocus
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => commitRename(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitRename(tab.id);
                    } else if (e.key === 'Escape') {
                      setEditingTabId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="tab-title">{tab.title}</span>
              )}
              <button
                className="icon-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title={t.tabBar.closeTab}
              >
                <X size={tabCloseSize} />
              </button>
            </div>
          );
        })}

        <button
          className="icon-btn"
          onClick={onAddTab}
          title={t.tabBar.newTab}
          style={{ marginLeft: 4, marginBottom: 4 }}
        >
          <Plus size={actionIconSize} />
        </button>
      </div>

      <div className="tab-actions">
        <button
          className={`icon-btn ${isQuickBarOpen ? 'active' : ''}`}
          onClick={onToggleQuickBar}
          title={t.tabBar.quickBarToggle}
        >
          <Zap size={actionIconSize} />
        </button>
        <button
          className="icon-btn"
          onClick={() => onSplitPane('vertical')}
          title={t.tabBar.splitVertical}
        >
          <Columns size={actionIconSize} />
        </button>
        <button
          className="icon-btn"
          onClick={() => onSplitPane('horizontal')}
          title={t.tabBar.splitHorizontal}
        >
          <Rows size={actionIconSize} />
        </button>
        <button
          className="toolbar-pill-btn"
          onClick={onOpenSshManager}
          title={`${t.tabBar.sshManager} (Ctrl+Shift+S)`}
        >
          <Server size={tabIconSize} />
          <span>SSH</span>
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title={t.tabBar.settings}
        >
          <Settings size={actionIconSize} />
        </button>
      </div>

      <div className="window-controls">
        <button
          className="window-ctrl-btn"
          onClick={() => window.novaTerm.windowControls.minimize()}
          title={t.tabBar.minimize}
        >
          <Minus size={windowIconSize} />
        </button>
        <button
          className="window-ctrl-btn"
          onClick={() => window.novaTerm.windowControls.maximize()}
          title={t.tabBar.maximize}
        >
          <Square size={Math.max(10, windowIconSize - 2)} />
        </button>
        <button
          className="window-ctrl-btn close"
          onClick={() => window.novaTerm.windowControls.close()}
          title={t.tabBar.closeWindow}
        >
          <X size={windowIconSize} />
        </button>
      </div>
    </header>
  );
};
