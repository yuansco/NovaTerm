import { useCallback, useEffect, useRef, useState } from 'react';
import {
  closePane as closePaneInTree,
  createLeafPane,
  getAdjacentLeafPaneId,
  getAllLeafPanes,
  resizePaneByDelta,
  splitPane as splitPaneInTree,
  updateLeafPane,
  updateSplitRatio,
} from '../../shared/paneTree';
import {
  AppConfig,
  PaneSessionConfig,
  SplitDirection,
  SshProfile,
  TabState,
  WorkspaceState,
} from '../../shared/types';
import { disposeTerminalInstance } from '../components/TerminalView';

function makeTabId(): string {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useWorkspaceStore() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [sshProfiles, setSshProfiles] = useState<SshProfile[]>([]);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const [loadedConfig, loadedState, loadedSsh] = await Promise.all([
        window.novaTerm.config.load(),
        window.novaTerm.state.load(),
        window.novaTerm.ssh.list(),
      ]);
      if (!mounted) return;
      setConfig(loadedConfig);
      setTabs(loadedState.tabs);
      setActiveTabId(loadedState.activeTabId || loadedState.tabs[0]?.id || '');
      setSshProfiles(loadedSsh);
      setIsLoaded(true);
    }
    void init();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-persistence middleware: debounced save on workspace state changes
  useEffect(() => {
    if (!isLoaded || tabs.length === 0) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      const payload: WorkspaceState = {
        tabs,
        activeTabId,
      };
      void window.novaTerm.state.save(payload);
    }, 250);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [isLoaded, tabs, activeTabId]);

  // Flush state before window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tabs.length > 0) {
        void window.novaTerm.state.save({ tabs, activeTabId });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tabs, activeTabId]);

  const addLocalTab = useCallback((cwd?: string, autoCommand?: string) => {
    const leaf = createLeafPane(
      { type: 'local', cwd, autoCommand },
      'Local Shell',
    );
    const newTab: TabState = {
      id: makeTabId(),
      title: 'Local Shell',
      rootPane: leaf,
      activePaneId: leaf.id,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const addSshTab = useCallback((profile: SshProfile) => {
    const title = profile.name || `${profile.username}@${profile.host}`;
    const leaf = createLeafPane(
      {
        type: 'ssh',
        sshProfileId: profile.id,
        autoCommand: profile.autoCommand,
      },
      title,
    );
    const newTab: TabState = {
      id: makeTabId(),
      title,
      rootPane: leaf,
      activePaneId: leaf.id,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const target = prev.find((t) => t.id === tabId);
        if (target) {
          for (const leaf of getAllLeafPanes(target.rootPane)) {
            disposeTerminalInstance(leaf.id);
            void window.novaTerm.session.close(leaf.id);
          }
        }
        const remaining = prev.filter((t) => t.id !== tabId);
        if (remaining.length === 0) {
          const freshLeaf = createLeafPane({ type: 'local' }, 'Local Shell');
          const freshTab: TabState = {
            id: makeTabId(),
            title: 'Local Shell',
            rootPane: freshLeaf,
            activePaneId: freshLeaf.id,
          };
          setActiveTabId(freshTab.id);
          return [freshTab];
        }
        if (activeTabId === tabId) {
          const closedIdx = prev.findIndex((t) => t.id === tabId);
          const nextTab = remaining[Math.max(0, closedIdx - 1)] ?? remaining[0];
          setActiveTabId(nextTab.id);
        }
        return remaining;
      });
    },
    [activeTabId],
  );

  const renameTab = useCallback((tabId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, title: trimmed, isCustomTitle: true } : t,
      ),
    );
  }, []);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setTabs((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const splitActivePane = useCallback(
    (direction: SplitDirection, customConfig?: PaneSessionConfig) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;
          const newLeaf = createLeafPane(
            customConfig ?? { type: 'local' },
            customConfig?.type === 'ssh' ? 'SSH' : 'Local Shell',
          );
          const updatedRoot = splitPaneInTree(
            tab.rootPane,
            tab.activePaneId,
            direction,
            newLeaf,
          );
          return {
            ...tab,
            rootPane: updatedRoot,
            activePaneId: newLeaf.id,
          };
        }),
      );
    },
    [activeTabId],
  );

  const closePane = useCallback(
    (tabId: string, paneId: string) => {
      disposeTerminalInstance(paneId);
      void window.novaTerm.session.close(paneId);
      setTabs((prev) => {
        const nextTabs: TabState[] = [];
        for (const tab of prev) {
          if (tab.id !== tabId) {
            nextTabs.push(tab);
            continue;
          }
          const nextRoot = closePaneInTree(tab.rootPane, paneId);
          if (!nextRoot) {
            continue;
          }
          const leaves = getAllLeafPanes(nextRoot);
          const nextActive = leaves.some((l) => l.id === tab.activePaneId)
            ? tab.activePaneId
            : leaves[0].id;
          nextTabs.push({
            ...tab,
            rootPane: nextRoot,
            activePaneId: nextActive,
          });
        }

        if (nextTabs.length === 0) {
          const freshLeaf = createLeafPane({ type: 'local' }, 'Local Shell');
          const freshTab: TabState = {
            id: makeTabId(),
            title: 'Local Shell',
            rootPane: freshLeaf,
            activePaneId: freshLeaf.id,
          };
          setActiveTabId(freshTab.id);
          return [freshTab];
        }
        if (!nextTabs.some((t) => t.id === activeTabId)) {
          setActiveTabId(nextTabs[0].id);
        }
        return nextTabs;
      });
    },
    [activeTabId],
  );

  const setActivePane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, activePaneId: paneId } : t)),
    );
  }, []);

  const focusAdjacentPane = useCallback(
    (offset: 1 | -1) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;
          const nextPaneId = getAdjacentLeafPaneId(t.rootPane, t.activePaneId, offset);
          return { ...t, activePaneId: nextPaneId };
        }),
      );
    },
    [activeTabId],
  );

  const resizePaneRatio = useCallback(
    (tabId: string, splitId: string, ratio: number) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, rootPane: updateSplitRatio(t.rootPane, splitId, ratio) }
            : t,
        ),
      );
    },
    [],
  );

  const resizeActivePaneByDelta = useCallback(
    (delta: number, direction?: SplitDirection) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;
          return {
            ...t,
            rootPane: resizePaneByDelta(t.rootPane, t.activePaneId, delta, direction),
          };
        }),
      );
    },
    [activeTabId],
  );

  const setPaneLogging = useCallback(
    (tabId: string, paneId: string, isLogging: boolean) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? {
                ...t,
                rootPane: updateLeafPane(t.rootPane, paneId, (leaf) => ({
                  ...leaf,
                  isLogging,
                })),
              }
            : t,
        ),
      );
    },
    [],
  );

  const updateConfig = useCallback(async (nextConfig: AppConfig) => {
    const saved = await window.novaTerm.config.save(nextConfig);
    setConfig(saved);
    setSshProfiles(saved.sshProfiles);
  }, []);

  const upsertSshProfile = useCallback(async (profile: SshProfile) => {
    const updated = await window.novaTerm.ssh.upsert(profile);
    setSshProfiles(updated);
    setConfig((prev) => (prev ? { ...prev, sshProfiles: updated } : prev));
  }, []);

  const deleteSshProfile = useCallback(async (profileId: string) => {
    const updated = await window.novaTerm.ssh.delete(profileId);
    setSshProfiles(updated);
    setConfig((prev) => (prev ? { ...prev, sshProfiles: updated } : prev));
  }, []);

  const exportConfig = useCallback(async () => {
    await window.novaTerm.state.save({ tabs, activeTabId });
    return window.novaTerm.config.exportJson();
  }, [tabs, activeTabId]);

  const importConfig = useCallback(async () => {
    const result = await window.novaTerm.config.importJson();
    if (!result) return null;
    setConfig(result.config);
    setSshProfiles(result.config.sshProfiles);
    if (result.workspaceState.tabs.length > 0) {
      setTabs(result.workspaceState.tabs);
      setActiveTabId(
        result.workspaceState.activeTabId || result.workspaceState.tabs[0].id,
      );
    }
    return result;
  }, []);

  return {
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
  };
}
