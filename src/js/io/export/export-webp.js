import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../core/state.js';
import { t } from '../../lang/i18n.js';

export function exportWebp() {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
  const ctx = canvas.getContext('2d');

  pixelMap.forEach((color, key) => {
    const x = key >> 16;
    const y = key & 0xFFFF;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });

  const a = document.createElement('a');
  a.download = 'pixel-art.webp';
  a.href = canvas.toDataURL('image/webp', 0.95);
  a.click();
  setStatus(t('status.dlWebp'));
}
