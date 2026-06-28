import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus } from '../core/state.js';
import { beginStroke, commitStroke, recordChange } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../lang/i18n.js';

export function setupFlipH() {
  document.getElementById('flipHBtn')?.addEventListener('click', () => {
    const newMap = new Map();
    pixelMap.forEach((color, key) => {
      const x = key >> 16;
      const y = key & 0xFFFF;
      newMap.set(((GRID_WIDTH - 1 - x) << 16) | y, color);
    });

    beginStroke();
    pixelMap.forEach((color, key) => {
      recordChange(key, color, null);
    });
    newMap.forEach((color, key) => {
      recordChange(key, null, color);
    });

    pixelMap.clear();
    newMap.forEach((color, key) => pixelMap.set(key, color));
    commitStroke(pixelMap);
    renderPixels();
    setStatus(t('status.flippedH'));
  });
}
