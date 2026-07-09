import { els, setStatus, GRID_WIDTH, GRID_HEIGHT, pixelMap, setGridSizeParams, resetMaps } from '../core/state.js';
import { t } from '../lang/i18n.js';
import { beginStroke, commitStroke, resetHistory } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { resizeCanvas, fitToScreen } from '../core/viewport.js';

import { syncGridSizeUI } from './grid-size-select.js';

export function setupTrim() {
  const trimBtn = document.getElementById('trimBtn');
  
  if (trimBtn) {
    trimBtn.onclick = async () => {
    let minX = GRID_WIDTH;
    let minY = GRID_HEIGHT;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const idx = y * GRID_WIDTH + x;
        if (pixelMap[idx] !== 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX === -1) {
      alert(t('status.blankCanvas') || "Canvas đang trống, không thể xén!");
      return;
    }

    const newW = maxX - minX + 1;
    const newH = maxY - minY + 1;

    if (newW === GRID_WIDTH && newH === GRID_HEIGHT) {
      setStatus("Không có viền thừa để xén.");
      return;
    }

    // Prepare new pixel map
    const newPixelMap = new Uint32Array(newW * newH);
    for (let y = 0; y < newH; y++) {
      for (let x = 0; x < newW; x++) {
        const oldX = minX + x;
        const oldY = minY + y;
        newPixelMap[y * newW + x] = pixelMap[oldY * GRID_WIDTH + oldX];
      }
    }

    // Push to undo stack
    beginStroke();
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = newW;
    offscreenCanvas.height = newH;
    const newCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    const newData = newCtx.createImageData(newW, newH);
    const newData32 = new Uint32Array(newData.data.buffer);
    newData32.set(newPixelMap);
    
    setGridSizeParams(newW, newH, newData, newData32);
    
    syncGridSizeUI(newW, newH);

    resetMaps(newData32);
    // Note: commitStroke in history.js currently only stores pixel diffs.
    // Changing dimensions will clear redo stack and we push a fake commit
    // to just reset current stroke state. Size undo needs history rewrite.
    commitStroke(newPixelMap);
    
    resetHistory();
    
    resizeCanvas();
    fitToScreen();
    renderPixels();
    
    setStatus(`Trimmed to ${newW}x${newH}`);
    };
  }
}
