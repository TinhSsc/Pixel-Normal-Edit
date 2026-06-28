import { GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { parseColorToRgba, colorDistance } from '../core/color-utils.js';

export function floodFill(pixelMap, startX, startY, fillColor, tolerance = 0) {
  const startKey = (startX << 16) | startY;
  const startColor = pixelMap.get(startKey) || null;

  if (startColor === fillColor) return new Map();

  const startRgba = startColor ? parseColorToRgba(startColor) : { r: 0, g: 0, b: 0, a: 0 };
  const fillRgba  = parseColorToRgba(fillColor);

  const visited = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const changed = new Map();
  const queue = [[startX, startY]];
  let head = 0;

  while (head < queue.length) {
    const [x, y] = queue[head++];
    const k = (x << 16) | y;
    const idx = y * GRID_WIDTH + x;

    if (visited[idx]) continue;
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) continue;

    visited[idx] = 1;

    const curColor = pixelMap.get(k) || null;
    const curRgba  = curColor ? parseColorToRgba(curColor) : { r: 0, g: 0, b: 0, a: 0 };
    const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, startRgba.r, startRgba.g, startRgba.b, startRgba.a);

    if (dist > tolerance) continue;

    changed.set(k, { x, y, oldColor: curColor, newColor: fillColor });

    if (x + 1 < GRID_WIDTH && !visited[y * GRID_WIDTH + (x + 1)]) queue.push([x + 1, y]);
    if (x - 1 >= 0 && !visited[y * GRID_WIDTH + (x - 1)]) queue.push([x - 1, y]);
    if (y + 1 < GRID_HEIGHT && !visited[(y + 1) * GRID_WIDTH + x]) queue.push([x, y + 1]);
    if (y - 1 >= 0 && !visited[(y - 1) * GRID_WIDTH + x]) queue.push([x, y - 1]);
  }

  return changed;
}
