import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../engine/core/state.js';
import { t } from '../../../../i18n/i18n.js';

function getPixelCanvas(tab = null, options = { transparent: true }) {
  const canvas = document.createElement('canvas');
  const w = tab ? tab.grid.w : GRID_WIDTH;
  const h = tab ? tab.grid.h : GRID_HEIGHT;
  const pMap = tab ? tab.pixelMap : pixelMap;
  
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!options.transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  const imgData = new ImageData(w, h);
  const data32 = new Uint32Array(imgData.data.buffer);
  data32.set(pMap);
  
  if (!options.transparent) {
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    tmpCanvas.getContext('2d').putImageData(imgData, 0, 0);
    ctx.drawImage(tmpCanvas, 0, 0);
  } else {
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

export function generateWorkspacePngBlob(tab = null, options = { transparent: true }) {
  return new Promise((resolve) => {
    const canvas = getPixelCanvas(tab, options);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function exportPng(tab = null, options = { transparent: true }) {
  const canvas = getPixelCanvas(tab, options);
  const namePrefix = tab ? tab.name.replace(/\s+/g, '-') : 'pixel-art';
  const a = document.createElement('a');
  a.download = `${namePrefix}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  setStatus(t('status.dlPng'));
}
