import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../core/state.js';
import { t } from '../../lang/i18n.js';

function getPixelCanvas(tab = null) {
  const canvas = document.createElement('canvas');
  const w = tab ? tab.grid.w : GRID_WIDTH;
  const h = tab ? tab.grid.h : GRID_HEIGHT;
  const pMap = tab ? tab.pixelMap : pixelMap;
  
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const imgData = new ImageData(w, h);
  const data32 = new Uint32Array(imgData.data.buffer);
  data32.set(pMap);
  
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = w;
  tmpCanvas.height = h;
  tmpCanvas.getContext('2d').putImageData(imgData, 0, 0);
  
  ctx.drawImage(tmpCanvas, 0, 0);

  return canvas;
}

export function exportJpeg(tab = null) {
  const canvas = getPixelCanvas(tab);
  const namePrefix = tab ? tab.name.replace(/\s+/g, '-') : 'pixel-art';
  const a = document.createElement('a');
  a.download = `${namePrefix}.jpg`;
  a.href = canvas.toDataURL('image/jpeg', 0.9);
  a.click();
  setStatus(t('status.dlJpeg'));
}

export function generateWorkspaceJpegBlob(tab = null) {
  return new Promise((resolve) => {
    const canvas = getPixelCanvas(tab);
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
