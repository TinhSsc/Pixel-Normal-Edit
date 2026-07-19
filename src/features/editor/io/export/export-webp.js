import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../engine/core/state.js';
import { t } from '../../../../i18n/i18n.js';

export function getPixelCanvas(tab = null) {
  const canvas = document.createElement('canvas');
  const w = tab ? tab.grid.w : GRID_WIDTH;
  const h = tab ? tab.grid.h : GRID_HEIGHT;
  const pMap = tab ? tab.pixelMap : pixelMap;
  
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const imgData = new ImageData(w, h);
  const data32 = new Uint32Array(imgData.data.buffer);
  data32.set(pMap);
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

export function exportWebp(tab = null) {
  const canvas = getPixelCanvas(tab);
  const namePrefix = tab ? tab.name.replace(/\s+/g, '-') : 'pixel-art';

  const a = document.createElement('a');
  a.download = `${namePrefix}.webp`;
  a.href = canvas.toDataURL('image/webp', 0.9);
  a.click();
  setStatus(t('status.dlWebp'));
}

export function generateWorkspaceWebpBlob(tab = null) {
  return new Promise((resolve) => {
    const canvas = getPixelCanvas(tab);
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/webp', 0.9);
  });
}
