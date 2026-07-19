import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus } from '../core/state.js';
import { beginStroke, commitStroke, recordChange } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../../../../i18n/i18n.js';
import { debouncedSaveWorkspace } from '../core/tab-manager.js';

let isSetup = false;
export function setupFlipH() {
  if (isSetup) return;
  isSetup = true;
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('#flipHBtn');
    if (!btn) return;
    const newMap = new Uint32Array(GRID_WIDTH * GRID_HEIGHT);
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const oldIdx = y * GRID_WIDTH + x;
        const newIdx = y * GRID_WIDTH + (GRID_WIDTH - 1 - x);
        newMap[newIdx] = pixelMap[oldIdx];
      }
    }

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
    setStatus(t('status.flippedH'));
    debouncedSaveWorkspace();
  });
}
