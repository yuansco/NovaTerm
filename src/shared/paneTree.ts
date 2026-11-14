import { PaneLeafNode, PaneNode, PaneSessionConfig, SplitDirection } from './types';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLeafPane(
  sessionConfig: PaneSessionConfig,
  title = 'Terminal',
  id = generateId('pane'),
): PaneLeafNode {
  return {
    kind: 'leaf',
    id,
    title,
    sessionConfig,
    isLogging: false,
  };
}

export function splitPane(
  root: PaneNode,
  targetPaneId: string,
  direction: SplitDirection,
  newLeaf: PaneLeafNode,
): PaneNode {
  if (root.kind === 'leaf') {
    if (root.id !== targetPaneId) {
      return root;
    }
    return {
      kind: 'split',
      id: generateId('split'),
      direction,
      ratio: 0.5,
      first: root,
      second: newLeaf,
    };
  }

  return {
    ...root,
    first: splitPane(root.first, targetPaneId, direction, newLeaf),
    second: splitPane(root.second, targetPaneId, direction, newLeaf),
  };
}

export function closePane(root: PaneNode, targetPaneId: string): PaneNode | null {
  if (root.kind === 'leaf') {
    return root.id === targetPaneId ? null : root;
  }

  if (root.first.kind === 'leaf' && root.first.id === targetPaneId) {
    return root.second;
  }
  if (root.second.kind === 'leaf' && root.second.id === targetPaneId) {
    return root.first;
  }

  const nextFirst = closePane(root.first, targetPaneId);
  if (nextFirst === null) {
    return root.second;
  }
  const nextSecond = closePane(root.second, targetPaneId);
  if (nextSecond === null) {
    return root.first;
  }

  if (nextFirst === root.first && nextSecond === root.second) {
    return root;
  }

  return {
    ...root,
    first: nextFirst,
    second: nextSecond,
  };
}

export function updateSplitRatio(root: PaneNode, splitId: string, ratio: number): PaneNode {
  const clamped = Math.min(0.9, Math.max(0.1, ratio));
  if (root.kind === 'leaf') {
    return root;
  }
  if (root.id === splitId) {
    return { ...root, ratio: clamped };
  }
  return {
    ...root,
    first: updateSplitRatio(root.first, splitId, clamped),
    second: updateSplitRatio(root.second, splitId, clamped),
  };
}

export function updateLeafPane(
  root: PaneNode,
  paneId: string,
  updater: (leaf: PaneLeafNode) => PaneLeafNode,
): PaneNode {
  if (root.kind === 'leaf') {
    return root.id === paneId ? updater(root) : root;
  }
  const nextFirst = updateLeafPane(root.first, paneId, updater);
  const nextSecond = updateLeafPane(root.second, paneId, updater);
  if (nextFirst === root.first && nextSecond === root.second) {
    return root;
  }
  return { ...root, first: nextFirst, second: nextSecond };
}

export function findLeafPane(root: PaneNode, paneId: string): PaneLeafNode | null {
  if (root.kind === 'leaf') {
    return root.id === paneId ? root : null;
  }
  return findLeafPane(root.first, paneId) ?? findLeafPane(root.second, paneId);
}

export function getAllLeafPanes(root: PaneNode): PaneLeafNode[] {
  if (root.kind === 'leaf') {
    return [root];
  }
  return [...getAllLeafPanes(root.first), ...getAllLeafPanes(root.second)];
}

export function getAdjacentLeafPaneId(
  root: PaneNode,
  currentPaneId: string,
  offset: 1 | -1,
): string {
  const leaves = getAllLeafPanes(root);
  if (leaves.length === 0) {
    return currentPaneId;
  }
  const idx = leaves.findIndex((leaf) => leaf.id === currentPaneId);
  if (idx === -1) {
    return leaves[0].id;
  }
  const nextIdx = (idx + offset + leaves.length) % leaves.length;
  return leaves[nextIdx].id;
}

/**
 * Adjusts the nearest ancestor split ratio along the specified direction
 * (or any direction if omitted) for keyboard-driven pane resizing.
 */
export function resizePaneByDelta(
  root: PaneNode,
  paneId: string,
  delta: number,
  direction?: SplitDirection,
): PaneNode {
  function containsPane(node: PaneNode): boolean {
    if (node.kind === 'leaf') return node.id === paneId;
    return containsPane(node.first) || containsPane(node.second);
  }

  function walk(node: PaneNode): { updated: PaneNode; handled: boolean } {
    if (node.kind === 'leaf') {
      return { updated: node, handled: false };
    }

    const inFirst = containsPane(node.first);
    const inSecond = containsPane(node.second);
    if (!inFirst && !inSecond) {
      return { updated: node, handled: false };
    }

    const childResult = inFirst ? walk(node.first) : walk(node.second);
    if (childResult.handled) {
      return {
        updated: inFirst
          ? { ...node, first: childResult.updated }
          : { ...node, second: childResult.updated },
        handled: true,
      };
    }

    if (!direction || node.direction === direction) {
      const sign = inFirst ? 1 : -1;
      const nextRatio = Math.min(0.9, Math.max(0.1, node.ratio + delta * sign));
      return {
        updated: { ...node, ratio: nextRatio },
        handled: true,
      };
    }

    return { updated: node, handled: false };
  }

  return walk(root).updated;
}
