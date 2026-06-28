import { GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { parseColorToRgba, colorDistance } from '../core/color-utils.js';

export function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function asyncFindContiguousRegion(pixelMap, startKey, matchColor, signal, onProgress) {
  const region = new Set();
  const queue = [startKey];
  region.add(startKey);
  
  let head = 0;
  let processed = 0;
  const CHUNK_SIZE = 50000;

  while (head < queue.length) {
    if (signal?.aborted) throw new Error('aborted');

    const k = queue[head++];
    const x = k >> 16;
    const y = k & 0xFFFF;
    
    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && ny >= 0 && nx < GRID_WIDTH && ny < GRID_HEIGHT) {
        const nk = (nx << 16) | ny;
        if (!region.has(nk)) {
          const c = pixelMap.get(nk) || null;
          if (c === matchColor) {
            region.add(nk);
            queue.push(nk);
          }
        }
      }
    }

    processed++;
    if (processed % CHUNK_SIZE === 0) {
      if (onProgress) onProgress(processed);
      await yieldToMain();
    }
  }
  
  return region;
}

export async function asyncFloodFill(pixelMap, startX, startY, fillColor, tolerance, signal, onProgress) {
  const startKey = (startX << 16) | startY;
  const startColor = pixelMap.get(startKey) || null;

  if (startColor === fillColor) return new Map();

  const startRgba = startColor ? parseColorToRgba(startColor) : { r: 0, g: 0, b: 0, a: 0 };
  const fillRgba  = parseColorToRgba(fillColor);

  const visited = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const changed = new Map();
  const queue = [[startX, startY]];
  let head = 0;
  let processed = 0;
  const CHUNK_SIZE = 50000;

  while (head < queue.length) {
    if (signal?.aborted) throw new Error('aborted');

    const [x, y] = queue[head++];
    const k = (x << 16) | y;
    const idx = y * GRID_WIDTH + x;

    if (visited[idx]) continue;
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) continue;

    visited[idx] = 1;

    const curColor = pixelMap.get(k) || null;
    const curRgba  = curColor ? parseColorToRgba(curColor) : { r: 0, g: 0, b: 0, a: 0 };
    const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, startRgba.r, startRgba.g, startRgba.b, startRgba.a);

    if (dist <= tolerance) {
      changed.set(k, { x, y, oldColor: curColor, newColor: fillColor });

      if (x + 1 < GRID_WIDTH && !visited[y * GRID_WIDTH + (x + 1)]) queue.push([x + 1, y]);
      if (x - 1 >= 0 && !visited[y * GRID_WIDTH + (x - 1)]) queue.push([x - 1, y]);
      if (y + 1 < GRID_HEIGHT && !visited[(y + 1) * GRID_WIDTH + x]) queue.push([x, y + 1]);
      if (y - 1 >= 0 && !visited[(y - 1) * GRID_WIDTH + x]) queue.push([x, y - 1]);
    }

    processed++;
    if (processed % CHUNK_SIZE === 0) {
      if (onProgress) onProgress(processed);
      await yieldToMain();
    }
  }

  return changed;
}

export async function asyncProcessChunks(items, processFn, signal, onProgress, chunkSize = 50000) {
  let processed = 0;
  const total = items.length || items.size;
  let isIterator = false;
  let iterator = null;

  if (items[Symbol.iterator] && !Array.isArray(items)) {
    isIterator = true;
    iterator = items[Symbol.iterator]();
  }

  while (true) {
    if (signal?.aborted) throw new Error('aborted');

    for (let i = 0; i < chunkSize; i++) {
      if (isIterator) {
        const next = iterator.next();
        if (next.done) return;
        processFn(next.value);
      } else {
        if (processed >= total) return;
        processFn(items[processed]);
      }
      processed++;
    }
    
    if (onProgress) onProgress(processed, total);
    await yieldToMain();
  }
}
