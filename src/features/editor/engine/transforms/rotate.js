import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus, setGridSizeParams, resetMaps } from '../core/state.js';
import { beginStroke, commitStroke, recordChange, resetHistory } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../../../../i18n/i18n.js';
import { debouncedSaveWorkspace } from '../core/tab-manager.js';
import { resizeCanvas, fitToScreen } from '../core/viewport.js';
import { syncGridSizeUI } from '../actions/grid-size-select.js';

let isSetup = false;
export function setupRotate() {
  if (isSetup) return;
  isSetup = true;
  document.body.addEventListener('click', (e) => {
    const rotateBtn = e.target.closest('#rotateBtn');
    
    if (!rotateBtn) return;
    
    const select = document.getElementById('rotateModeSelect');
    const rotateSize = select ? select.value === 'size' : true;
    
    const executeRotate = (rotateSize) => {
      let newW = GRID_WIDTH;
      let newH = GRID_HEIGHT;
      if (rotateSize) {
        newW = GRID_HEIGHT;
        newH = GRID_WIDTH;
      }

      const newMap = new Uint32Array(newW * newH);
      
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const oldIdx = y * GRID_WIDTH + x;
          const color = pixelMap[oldIdx];
          if (color === 0) continue;

          const nx = GRID_HEIGHT - 1 - y;
          const ny = x;
          if (nx >= 0 && nx < newW && ny >= 0 && ny < newH) {
             const newIdx = ny * newW + nx;
             newMap[newIdx] = color;
          }
        }
      }

      if (rotateSize) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = newW;
        offCanvas.height = newH;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, newW, newH);
        const data32 = new Uint32Array(imgData.data.buffer);
        
        setGridSizeParams(newW, newH, imgData, data32);
        resetMaps(newMap);
        resetHistory();
        syncGridSizeUI(newW, newH);
        resizeCanvas();
        fitToScreen();
        renderPixels();
        setStatus(t('status.rotated'));
        debouncedSaveWorkspace();
      } else {
        beginStroke();
        for (let i = 0; i < pixelMap.length; i++) {
           const oldColor = pixelMap[i];
           const newColor = newMap[i];
           if (oldColor !== newColor) {
             recordChange(i, oldColor, newColor);
           }
        }

        pixelMap.set(newMap);
        commitStroke(pixelMap);
        renderPixels();
        setStatus(t('status.rotated'));
        debouncedSaveWorkspace();
      }
    };

    executeRotate(rotateSize);
  });
}
