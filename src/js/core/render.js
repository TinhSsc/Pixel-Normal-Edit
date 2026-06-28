import { ctx, GRID_WIDTH, GRID_HEIGHT, pixelMap, previewPixels, offscreenImageData, offscreenData32 } from './state.js';
import { getZoom, getPan, applyTransform } from './viewport.js';
import { parseColorToUint32 } from './color-utils.js';

let showGridFlag = true;

export function setShowGrid(val) {
  showGridFlag = val;
}

export function renderPixels() {
  if (!ctx || !offscreenImageData || !offscreenData32) return;

  // Clear offscreen buffer
  offscreenData32.fill(0);

  // Draw pixelMap
  pixelMap.forEach((color, key) => {
    const x = key >> 16;
    const y = key & 0xFFFF;
    offscreenData32[y * GRID_WIDTH + x] = parseColorToUint32(color);
  });

  // Draw preview (e.g. line, shape preview)
  if (previewPixels) {
    previewPixels.forEach(({ x, y, color }) => {
      if (x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT) {
        offscreenData32[y * GRID_WIDTH + x] = parseColorToUint32(color);
      }
    });
  }

  // Blit buffer to canvas
  ctx.putImageData(offscreenImageData, 0, 0);
}
