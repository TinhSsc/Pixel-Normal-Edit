import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSelectionComparison,
  calculateSelectionSizes,
  createRatioSelectionBox,
  normalizeSelectionBox,
} from '../src/features/editor/engine/core/selection-ratio.js';

test('creates a 1/2 box from a 128x72 main', () => {
  const box = createRatioSelectionBox({ x: 0, y: 0, width: 128, height: 72 }, 1, 2);
  assert.deepEqual(box, { x: 32, y: 18, width: 64, height: 36 });

  const stats = calculateSelectionComparison({ x: 0, y: 0, width: 128, height: 72 }, box);
  assert.equal(stats.mainArea, 9216);
  assert.equal(stats.compareArea, 2304);
  assert.equal(stats.areaPercent, 25);
  assert.equal(stats.pixelDifference, 6912);
});

test('creates a 3/4 box and derives area from the rounded dimensions', () => {
  const main = { x: 0, y: 0, width: 128, height: 72 };
  const box = createRatioSelectionBox(main, 3, 4);
  assert.deepEqual(box, { x: 16, y: 9, width: 96, height: 54 });

  const stats = calculateSelectionComparison(main, box);
  assert.equal(stats.compareArea, 5184);
  assert.equal(stats.widthPercent, 75);
  assert.equal(stats.heightPercent, 75);
  assert.equal(stats.areaPercent, 56.25);
});

test('keeps at least one pixel for tiny selections', () => {
  const main = { x: 0, y: 0, width: 1, height: 1 };
  assert.deepEqual(createRatioSelectionBox(main, 1, 4), main);
  assert.equal(calculateSelectionComparison(main, main).areaPercent, 100);
});

test('rounds each axis independently and reports the real result', () => {
  const main = { x: 0, y: 0, width: 128, height: 72 };
  const box = createRatioSelectionBox(main, 1, 3);
  assert.deepEqual(box, { x: 42, y: 24, width: 43, height: 24 });

  const stats = calculateSelectionComparison(main, box);
  assert.equal(stats.compareArea, 1032);
  assert.ok(Math.abs(stats.areaPercent - (1032 / 9216) * 100) < 0.0001);
});

test('centers the derived box inside a main box with an offset', () => {
  const box = createRatioSelectionBox({ x: 5, y: 7, width: 128, height: 72 }, 1, 2);
  assert.deepEqual(box, { x: 37, y: 25, width: 64, height: 36 });
});

test('converts a huge real canvas to Main reference pixels', () => {
  const main = { x: 0, y: 0, width: 1800, height: 1000 };
  const compare = { x: 450, y: 250, width: 900, height: 500 };
  const reference = { width: 128, height: 72 };
  const sizes = calculateSelectionSizes(main, compare, reference);

  assert.deepEqual(sizes.mainSize, { width: 128, height: 72 });
  assert.deepEqual(sizes.compareSize, { width: 64, height: 36 });
  assert.deepEqual(sizes.mainRange, { startRow: 1, startCol: 1, endRow: 72, endCol: 128 });
  assert.deepEqual(sizes.compareRange, { startRow: 19, startCol: 33, endRow: 54, endCol: 96 });

  const stats = calculateSelectionComparison(main, compare, reference);
  assert.equal(stats.mainArea, 9216);
  assert.equal(stats.compareArea, 2304);
  assert.equal(stats.areaPercent, 25);
  assert.equal(stats.pixelDifference, 6912);
});

test('uses real selection sizes when reference pixels are empty', () => {
  const main = { x: 0, y: 0, width: 1800, height: 1000 };
  const compare = { x: 450, y: 250, width: 900, height: 500 };
  const sizes = calculateSelectionSizes(main, compare, null);

  assert.equal(sizes.usesReference, false);
  assert.deepEqual(sizes.mainSize, { width: 1800, height: 1000 });
  assert.deepEqual(sizes.compareSize, { width: 900, height: 500 });
  assert.deepEqual(sizes.compareRange, { startRow: 251, startCol: 451, endRow: 750, endCol: 1350 });
});

test('allows a manually drawn compare box outside main', () => {
  const main = { x: 0, y: 0, width: 10, height: 10 };
  const compare = { x: 20, y: 20, width: 20, height: 10 };
  const stats = calculateSelectionComparison(main, compare);

  assert.equal(stats.compareArea, 200);
  assert.equal(stats.areaPercent, 200);
  assert.equal(stats.pixelDifference, -100);
});

test('rejects invalid boxes and ratios larger than main', () => {
  assert.equal(normalizeSelectionBox({ x: 0, y: 0, width: 0, height: 4 }), null);
  assert.equal(createRatioSelectionBox(null, 1, 2), null);
  assert.equal(createRatioSelectionBox({ x: 0, y: 0, width: 10, height: 10 }, 2, 1), null);
  assert.equal(createRatioSelectionBox({ x: 0, y: 0, width: 10, height: 10 }, 1, 0), null);
});
