import React, { useEffect, useMemo, useState } from 'react';
import { getTranslations } from '../shared/i18n';
import { resolveTheme } from '../shared/themes';
import { QuickCommandItem } from '../shared/types';
import { QuickCommandBar } from './components/QuickCommandBar';
import { SettingsModal } from './components/SettingsModal';
import { SplitPaneContainer } from './components/SplitPaneContainer';
import { SshManagerModal } from './components/SshManagerModal';
import { TabBar } from './components/TabBar';
import { useWorkspaceStore } from './store/useWorkspaceStore';

export const App: React.FC = () => {
  const {
    isLoaded,
    tabs,
    activeTabId,
    config,
    sshProfiles,
    setActiveTabId,
    addLocalTab,
    addSshTab,
    closeTab,
    renameTab,
    reorderTabs,
    splitActivePane,
    closePane,
    setActivePane,
    focusAdjacentPane,
    resizePaneRatio,
    resizeActivePaneByDelta,
    setPaneLogging,
    updateConfig,
    upsertSshProfile,
    deleteSshProfile,
    exportConfig,
    importConfig,
  } = useWorkspaceStore();

  const [showSshModal, setShowSshModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const isQuickBarOpen = config?.showQuickCommandBar ?? true;
  const quickCommands: QuickCommandItem[] = useMemo(() => {
    if (config?.quickCommands && config.quickCommands.length > 0) {
      return config.quickCommands;
    }
    return [
      {
        id: 'qc-uname',
        label: 'uname -a',
        command: 'uname -a',
        appendNewline: true,
      },
    ];
  }, [config?.quickCommands]);

  const handleToggleQuickBar = () => {
    if (!config) return;
    void updateConfig({
      ...config,
      showQuickCommandBar: !isQuickBarOpen,
    });
  };

  const handleExecuteQuickCommand = (item: QuickCommandItem) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) return;
    const normalized = item.command.replace(/\r\n/g, '\r').replace(/\n/g, '\r');
    const suffix = item.appendNewline ? '\r' : '';
    window.novaTerm.session.write(
      activeTab.activePaneId,
      `${normalized}${suffix}`,
    );
  };

  const handleSaveQuickCommands = async (nextCommands: QuickCommandItem[]) => {
    if (!config) return;
    await updateConfig({
      ...config,
      quickCommands: nextCommands,
    });
  };

  const t = useMemo(() => getTranslations(config?.language), [config?.language]);

  const activeTheme = useMemo(() => {
    if (!config) return resolveTheme('one-dark');
    return resolveTheme(config.themeId, config.customThemes);
  }, [config]);

  // Apply dynamic UI theme CSS variables & custom CSS
  useEffect(() => {
    const root = document.documentElement.style;
    const { ui } = activeTheme;
    root.setProperty('--nt-window-bg', ui.windowBg);
    root.setProperty('--nt-tab-bar-bg', ui.tabBarBg);
    root.setProperty('--nt-tab-active-bg', ui.tabActiveBg);
    root.setProperty('--nt-tab-hover-bg', ui.tabHoverBg);
    root.setProperty('--nt-surface-bg', ui.surfaceBg);
    root.setProperty('--nt-border-color', ui.borderColor);
    root.setProperty('--nt-splitter-color', ui.splitterColor);
    root.setProperty('--nt-accent-color', ui.accentColor);
    root.setProperty('--nt-text-primary', ui.textPrimary);
    root.setProperty('--nt-text-secondary', ui.textSecondary);
    root.setProperty('--nt-danger-color', ui.dangerColor);
    root.setProperty('--nt-success-color', ui.successColor);

    let styleEl = document.getElementById('novaterm-custom-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'novaterm-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = activeTheme.customCss ?? '';
  }, [activeTheme]);

  // Global keyboard shortcuts for tabs, splits, pane focus, and resizing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'T') {
        e.preventDefault();
        addLocalTab();
      } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault();
        splitActivePane('vertical');
      } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'E') {
        e.preventDefault();
        splitActivePane('horizontal');
      } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'W') {
        e.preventDefault();
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab) {
          closePane(activeTab.id, activeTab.activePaneId);
        }
      } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'S') {
        e.preventDefault();
        setShowSshModal((prev) => !prev);
      } else if (e.altKey && !e.ctrlKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
        e.preventDefault();
        focusAdjacentPane(1);
      } else if (e.altKey && !e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
        e.preventDefault();
        focusAdjacentPane(-1);
      } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        resizeActivePaneByDelta(-0.05, 'vertical');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        resizeActivePaneByDelta(0.05, 'vertical');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        resizeActivePaneByDelta(-0.05, 'horizontal');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        resizeActivePaneByDelta(0.05, 'horizontal');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    tabs,
    activeTabId,
    addLocalTab,
    splitActivePane,
    closePane,
    focusAdjacentPane,
    resizeActivePaneByDelta,
  ]);

  if (!isLoaded || !config) {
    return (
      <div
        className="app-shell"
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        {t.loading}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TabBar
        t={t}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={() => addLocalTab()}
        onCloseTab={closeTab}
        onRenameTab={renameTab}
        onReorderTabs={reorderTabs}
        onSplitPane={(dir) => splitActivePane(dir)}
        isQuickBarOpen={isQuickBarOpen}
        onToggleQuickBar={handleToggleQuickBar}
        onOpenSshManager={() => setShowSshModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <main className="workspace-body">
        {tabs.map((tab) => {
          const isVisible = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`tab-panel ${isVisible ? '' : 'hidden'}`}
            >
              <SplitPaneContainer
                t={t}
                node={tab.rootPane}
                activePaneId={tab.activePaneId}
                isTabVisible={isVisible}
                config={config}
                theme={activeTheme}
                onFocusPane={(paneId) => setActivePane(tab.id, paneId)}
                onSplitPane={(dir) => splitActivePane(dir)}
                onClosePane={(paneId) => closePane(tab.id, paneId)}
                onResizeRatio={(splitId, ratio) =>
                  resizePaneRatio(tab.id, splitId, ratio)
                }
                onLoggingChange={(paneId, logging) =>
                  setPaneLogging(tab.id, paneId, logging)
                }
              />
            </div>
          );
        })}
      </main>

      {isQuickBarOpen && (
        <QuickCommandBar
          t={t}
          commands={quickCommands}
          fontFamily={config.fontFamily}
          fontSize={config.fontSize}
          onExecute={handleExecuteQuickCommand}
          onSaveCommands={handleSaveQuickCommands}
          onClose={handleToggleQuickBar}
        />
      )}

      {showSshModal && (
        <SshManagerModal
          t={t}
          profiles={sshProfiles}
          onConnect={(profile) => addSshTab(profile)}
          onSaveProfile={upsertSshProfile}
          onDeleteProfile={deleteSshProfile}
          onClose={() => setShowSshModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          config={config}
          tabs={tabs}
          activeTabId={activeTabId}
          onSave={updateConfig}
          onExportJson={exportConfig}
          onImportJson={importConfig}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
