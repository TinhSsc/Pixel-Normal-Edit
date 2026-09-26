import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearQuickRegionMask,
  findColorRegion,
  getQuickRegionMask,
  setQuickRegionMask,
} from '../src/features/editor/engine/core/color-region-select.js';
import { parseColorToUint32 } from '../src/features/editor/engine/core/color-utils.js';

const RED = parseColorToUint32('#ff0000');
const DARK_RED = parseColorToUint32('#e60000');
const BLUE = parseColorToUint32('#0000ff');

function makeCanvas(width, height) {
  return { width, height, map: new Uint32Array(width * height) };
}

function fillRect(canvas, x, y, w, h, color) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      canvas.map[row * canvas.width + col] = color;
    }
  }
}

function drawRing(canvas, x, y, w, h, color, thickness = 1) {
  fillRect(canvas, x, y, w, thickness, color);
  fillRect(canvas, x, y + h - thickness, w, thickness, color);
  fillRect(canvas, x, y, thickness, h, color);
  fillRect(canvas, x + w - thickness, y, thickness, h, color);
}

test('spreading a button outline returns the whole button rectangle', () => {
  const canvas = makeCanvas(32, 32);
  // Button 10..21 x 6..17 with a 1px outline, hollow inside.
  drawRing(canvas, 10, 6, 12, 12, RED);
  fillRect(canvas, 12, 8, 8, 8, BLUE);

  const region = findColorRegion(canvas.map, canvas.width, canvas.height, 10, 6);

  assert.equal(region.count, 44); // ring of 12x12 with 1px border
  assert.deepEqual(region.box, { x: 10, y: 6, width: 12, height: 12 });
  assert.equal(region.colorHex, '#ff0000');
  assert.equal(region.truncated, false);
  assert.equal(region.mask[6 * 32 + 10], 1);
  assert.equal(region.mask[8 * 32 + 12], 0); // interior of the button is not part of the region
});

test('a hollow outline ring is one connected region, two separate rings are not', () => {
  const canvas = makeCanvas(40, 20);
  drawRing(canvas, 2, 2, 8, 8, RED);
  drawRing(canvas, 20, 2, 8, 8, RED);

  const first = findColorRegion(canvas.map, canvas.width, canvas.height, 2, 2);
  assert.deepEqual(first.box, { x: 2, y: 2, width: 8, height: 8 });

  const global = findColorRegion(canvas.map, canvas.width, canvas.height, 2, 2, { contiguous: false });
  assert.deepEqual(global.box, { x: 2, y: 2, width: 26, height: 8 });
  assert.equal(global.count, first.count * 2);
});

test('spread only reaches connected pixels, never diagonal ones', () => {
  const canvas = makeCanvas(8, 8);
  canvas.map[0] = RED;                 // (0,0)
  canvas.map[9] = RED;                 // (1,1) — diagonal only

  const region = findColorRegion(canvas.map, canvas.width, canvas.height, 0, 0);
  assert.equal(region.count, 1);
  assert.deepEqual(region.box, { x: 0, y: 0, width: 1, height: 1 });
});

test('color tolerance widens the spread to similar shades', () => {
  const canvas = makeCanvas(8, 8);
  canvas.map[0] = RED;
  canvas.map[1] = DARK_RED;
  canvas.map[2] = BLUE;

  const strict = findColorRegion(canvas.map, canvas.width, canvas.height, 0, 0);
  assert.equal(strict.count, 1);

  const loose = findColorRegion(canvas.map, canvas.width, canvas.height, 0, 0, { tolerance: 40 });
  assert.equal(loose.count, 2);
  assert.deepEqual(loose.box, { x: 0, y: 0, width: 2, height: 1 });
});

test('clicking an empty pixel yields no region', () => {
  const canvas = makeCanvas(8, 8);
  fillRect(canvas, 2, 2, 2, 2, RED);

  const region = findColorRegion(canvas.map, canvas.width, canvas.height, 0, 0);
  assert.equal(region.count, 0);
  assert.equal(region.box, null);
  assert.equal(region.colorHex, null);
  assert.equal(region.targetUint32, 0);
});

test('rejects out-of-bounds coordinates and bad input', () => {
  const canvas = makeCanvas(8, 8);
  canvas.map[0] = RED;

  assert.equal(findColorRegion(canvas.map, canvas.width, canvas.height, -1, 0), null);
  assert.equal(findColorRegion(canvas.map, canvas.width, canvas.height, 0, 8), null);
  assert.equal(findColorRegion(null, 8, 8, 0, 0), null);
});

test('stops at maxPixels and reports truncation', () => {
  const canvas = makeCanvas(10, 10);
  fillRect(canvas, 0, 0, 10, 10, RED);

  const region = findColorRegion(canvas.map, canvas.width, canvas.height, 0, 0, { maxPixels: 30 });
  assert.equal(region.count, 30);
  assert.equal(region.truncated, true);
  assert.ok(region.box.width > 0 && region.box.height > 0);
});

test('region mask can be stored and cleared for the renderer', () => {
  assert.equal(getQuickRegionMask(), null);

  const mask = new Uint8Array([1, 0, 1]);
  setQuickRegionMask(mask, 3, 1);
  assert.equal(getQuickRegionMask().mask, mask);
  assert.equal(getQuickRegionMask().width, 3);
  assert.equal(getQuickRegionMask().height, 1);

  clearQuickRegionMask();
  assert.equal(getQuickRegionMask(), null);
});
