import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../engine/core/state.js';
import { t } from '../../../../i18n/i18n.js';
import { uint32ToRgba, rgbaToHex } from '../../engine/core/color-utils.js';

export function generateWorkspaceJson(tab = null) {
  const w = tab ? tab.grid.w : GRID_WIDTH;
  const h = tab ? tab.grid.h : GRID_HEIGHT;
  const pMap = tab ? tab.pixelMap : pixelMap;
  
  const pixels = {};
  for (let i = 0; i < pMap.length; i++) {
    const val = pMap[i];
    if (val !== 0) {
      const y = Math.floor(i / w);
      const x = i % w;
      const key = (x << 16) | y;
      const rgba = uint32ToRgba(val);
      pixels[key] = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    }
  }
  
  const data = {
    width: w,
    height: h,
    pixels: pixels
  };
  
  return JSON.stringify(data, null, 2);
}

export function exportJson(tab = null) {
  const jsonStr = generateWorkspaceJson(tab);

  const namePrefix = tab ? tab.name.replace(/\s+/g, '-') : 'pixel-art';
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = `${namePrefix}.json`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus(t('status.dlJson'));
}

export function generateWorkspaceJsonBlob(tab = null) {
  const jsonStr = generateWorkspaceJson(tab);
  return new Blob([jsonStr], { type: 'application/json' });
}
