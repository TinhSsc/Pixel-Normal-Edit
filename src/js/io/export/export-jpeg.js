import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../core/state.js';
import { t } from '../../lang/i18n.js';

function getPixelCanvas(bg = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

  pixelMap.forEach((color, key) => {
    const x = key >> 16;
    const y = key & 0xFFFF;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });

  return canvas;
}

export function exportJpeg() {
  const canvas = getPixelCanvas('#ffffff');
  const a = document.createElement('a');
  a.download = 'pixel-art.jpg';
  a.href = canvas.toDataURL('image/jpeg', 0.95);
  a.click();
  setStatus(t('status.dlJpeg'));
}
