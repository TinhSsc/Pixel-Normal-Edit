import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../core/state.js';
import { t } from '../../lang/i18n.js';

function getPixelCanvas() {
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

  return canvas;
}

export function exportPng() {
  const canvas = getPixelCanvas();
  const a = document.createElement('a');
  a.download = 'pixel-art.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
  setStatus(t('status.dlPng'));
}
