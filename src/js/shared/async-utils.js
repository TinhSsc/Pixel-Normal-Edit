import { GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { colorDistance, uint32ToRgba, parseColorToUint32 } from '../core/color-utils.js';

export function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function asyncFindContiguousRegion(pixelMap, startX, startY, matchColor, signal, onProgress) {
  const region = new Set();
  const startIdx = startY * GRID_WIDTH + startX;
  const matchUint32 = typeof matchColor === 'number' ? matchColor : (matchColor && matchColor !== 'transparent' ? parseColorToUint32(matchColor) : 0);
  
  const queue = [startIdx];
  region.add(startIdx);
  
  let head = 0;
  let processed = 0;
  const CHUNK_SIZE = 50000;

  while (head < queue.length) {
    if (signal?.aborted) throw new Error('aborted');

    const idx = queue[head++];
    const y = Math.floor(idx / GRID_WIDTH);
    const x = idx % GRID_WIDTH;
    
    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && ny >= 0 && nx < GRID_WIDTH && ny < GRID_HEIGHT) {
        const nIdx = ny * GRID_WIDTH + nx;
        if (!region.has(nIdx)) {
          const c = pixelMap[nIdx];
          if (c === matchUint32) {
            region.add(nIdx);
            queue.push(nIdx);
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
  const startIdx = startY * GRID_WIDTH + startX;
  const startUint32 = pixelMap[startIdx];

  const fillUint32 = fillColor && fillColor !== 'transparent' ? parseColorToUint32(fillColor) : 0;
  if (startUint32 === fillUint32) return new Map();

  const startRgba = uint32ToRgba(startUint32);

  const visited = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const changed = new Map();
  const queue = [[startX, startY]];
  let head = 0;
  let processed = 0;
  const CHUNK_SIZE = 50000;

  while (head < queue.length) {
    if (signal?.aborted) throw new Error('aborted');

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
