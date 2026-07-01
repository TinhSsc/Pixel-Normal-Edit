import { GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { colorDistance, uint32ToRgba, parseColorToUint32 } from '../core/color-utils.js';

export function floodFill(pixelMap, startX, startY, fillColor, tolerance = 0) {
  const startIdx = startY * GRID_WIDTH + startX;
  const startUint32 = pixelMap[startIdx];

  const fillUint32 = fillColor && fillColor !== 'transparent' ? parseColorToUint32(fillColor) : 0;
  if (startUint32 === fillUint32) return new Map();

  const startRgba = uint32ToRgba(startUint32);

  const visited = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const changed = new Map();
  const queue = [[startX, startY]];
  let head = 0;

  while (head < queue.length) {
    const [x, y] = queue[head++];
    const idx = y * GRID_WIDTH + x;

    if (visited[idx]) continue;
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) continue;

    visited[idx] = 1;

    const curUint32 = pixelMap[idx];
    if (tolerance === 0) {
      if (curUint32 !== startUint32) continue;
    } else {
      const curRgba = uint32ToRgba(curUint32);
      const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, startRgba.r, startRgba.g, startRgba.b, startRgba.a);
      if (dist > tolerance) continue;
    }

    changed.set(idx, { x, y, oldColor: curUint32, newColor: fillUint32 });

    if (x + 1 < GRID_WIDTH && !visited[y * GRID_WIDTH + (x + 1)]) queue.push([x + 1, y]);
    if (x - 1 >= 0 && !visited[y * GRID_WIDTH + (x - 1)]) queue.push([x - 1, y]);
    if (y + 1 < GRID_HEIGHT && !visited[(y + 1) * GRID_WIDTH + x]) queue.push([x, y + 1]);
    if (y - 1 >= 0 && !visited[(y - 1) * GRID_WIDTH + x]) queue.push([x, y - 1]);
  }

  return changed;
}
