import React, { useRef, useState } from 'react';
import { Translations } from '../../shared/i18n';
import {
  AppConfig,
  PaneNode,
  SplitDirection,
  ThemeSchema,
} from '../../shared/types';
import { TerminalView } from './TerminalView';

interface SplitPaneContainerProps {
  t: Translations;
  node: PaneNode;
  activePaneId: string;
  isTabVisible: boolean;
  config: AppConfig;
  theme: ThemeSchema;
  onFocusPane: (paneId: string) => void;
  onSplitPane: (direction: SplitDirection) => void;
  onClosePane: (paneId: string) => void;
  onResizeRatio: (splitId: string, ratio: number) => void;
  onLoggingChange: (paneId: string, isLogging: boolean) => void;
}

export const SplitPaneContainer: React.FC<SplitPaneContainerProps> = ({
  t,
  node,
  activePaneId,
  isTabVisible,
  config,
  theme,
  onFocusPane,
  onSplitPane,
  onClosePane,
  onResizeRatio,
  onLoggingChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (node.kind === 'leaf') {
    return (
      <TerminalView
        t={t}
        pane={node}
        isActive={node.id === activePaneId}
        isTabVisible={isTabVisible}
        config={config}
        theme={theme}
        onFocus={() => onFocusPane(node.id)}
        onSplit={onSplitPane}
        onClosePane={() => onClosePane(node.id)}
        onLoggingChange={(logging) => onLoggingChange(node.id, logging)}
      />
    );
  }

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    let rafId: number | null = null;
    let latestRatio: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextRatio =
        node.direction === 'vertical'
          ? (moveEvent.clientX - rect.left) / rect.width
          : (moveEvent.clientY - rect.top) / rect.height;

      latestRatio = nextRatio;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (latestRatio !== null) {
            onResizeRatio(node.id, latestRatio);
          }
        });
      }
    };

    const onMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const firstPercent = `${(node.ratio * 100).toFixed(2)}%`;
  const secondPercent = `${((1 - node.ratio) * 100).toFixed(2)}%`;

  return (
    <div ref={containerRef} className={`split-container ${node.direction}`}>
      <div className="split-child" style={{ flexBasis: firstPercent, flexGrow: 0 }}>
        <SplitPaneContainer
          t={t}
          node={node.first}
          activePaneId={activePaneId}
          isTabVisible={isTabVisible}
          config={config}
          theme={theme}
          onFocusPane={onFocusPane}
          onSplitPane={onSplitPane}
          onClosePane={onClosePane}
          onResizeRatio={onResizeRatio}
          onLoggingChange={onLoggingChange}
        />
      </div>

      <div
        className={`split-divider ${node.direction} ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleDividerMouseDown}
      />

      <div className="split-child" style={{ flexBasis: secondPercent, flexGrow: 0 }}>
        <SplitPaneContainer
          t={t}
          node={node.second}
          activePaneId={activePaneId}
          isTabVisible={isTabVisible}
          config={config}
          theme={theme}
          onFocusPane={onFocusPane}
          onSplitPane={onSplitPane}
          onClosePane={onClosePane}
          onResizeRatio={onResizeRatio}
          onLoggingChange={onLoggingChange}
        />
      </div>
    </div>
  );
};
