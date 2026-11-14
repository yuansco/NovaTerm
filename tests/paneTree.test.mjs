import assert from 'node:assert/strict';
import test from 'node:test';
import {
  closePane,
  createLeafPane,
  getAdjacentLeafPaneId,
  getAllLeafPanes,
  resizePaneByDelta,
  splitPane,
  updateSplitRatio,
} from '../dist/shared/paneTree.js';

test('paneTree supports unlimited hierarchical splits and clean collapse on close', () => {
  const p1 = createLeafPane({ type: 'local' }, 'Pane 1', 'p1');
  const p2 = createLeafPane({ type: 'local' }, 'Pane 2', 'p2');
  const p3 = createLeafPane({ type: 'ssh', sshProfileId: 'srv' }, 'Pane 3', 'p3');

  const split1 = splitPane(p1, 'p1', 'vertical', p2);
  const split2 = splitPane(split1, 'p2', 'horizontal', p3);

  const leaves = getAllLeafPanes(split2);
  assert.deepEqual(
    leaves.map((l) => l.id),
    ['p1', 'p2', 'p3'],
  );

  assert.equal(getAdjacentLeafPaneId(split2, 'p1', 1), 'p2');
  assert.equal(getAdjacentLeafPaneId(split2, 'p3', 1), 'p1');
  assert.equal(getAdjacentLeafPaneId(split2, 'p1', -1), 'p3');

  const afterCloseP2 = closePane(split2, 'p2');
  assert.ok(afterCloseP2);
  assert.deepEqual(
    getAllLeafPanes(afterCloseP2).map((l) => l.id),
    ['p1', 'p3'],
  );

  const afterCloseP1 = closePane(afterCloseP2, 'p1');
  assert.ok(afterCloseP1);
  assert.equal(afterCloseP1.kind, 'leaf');
  assert.equal(afterCloseP1.id, 'p3');

  assert.equal(closePane(afterCloseP1, 'p3'), null);
});

test('paneTree clamps split ratios and supports keyboard delta resize', () => {
  const p1 = createLeafPane({ type: 'local' }, 'P1', 'p1');
  const p2 = createLeafPane({ type: 'local' }, 'P2', 'p2');
  const tree = splitPane(p1, 'p1', 'vertical', p2);
  assert.equal(tree.kind, 'split');

  const clampedHigh = updateSplitRatio(tree, tree.id, 0.99);
  assert.equal(clampedHigh.kind, 'split');
  assert.equal(clampedHigh.ratio, 0.9);

  const clampedLow = updateSplitRatio(tree, tree.id, 0.01);
  assert.equal(clampedLow.kind, 'split');
  assert.equal(clampedLow.ratio, 0.1);

  const resizedFromP1 = resizePaneByDelta(tree, 'p1', 0.1, 'vertical');
  assert.equal(resizedFromP1.kind, 'split');
  assert.ok(Math.abs(resizedFromP1.ratio - 0.6) < 1e-6);

  const resizedFromP2 = resizePaneByDelta(tree, 'p2', 0.1, 'vertical');
  assert.equal(resizedFromP2.kind, 'split');
  assert.ok(Math.abs(resizedFromP2.ratio - 0.4) < 1e-6);
});
