import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setStatus } from '../../core/state.js';
import { t } from '../../lang/i18n.js';

export function exportJson() {
  const data = {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    pixels: Object.fromEntries(pixelMap)
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = 'pixel-art.json';
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus(t('status.dlJson'));
}
