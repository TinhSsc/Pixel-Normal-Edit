import { pixelMap, els, setStatus } from '../core/state.js';
import { t } from '../lang/i18n.js';

export function usePicker(cell) {
  const key = (cell.x << 16) | cell.y;
  const color = pixelMap.get(key);
  if (color && els.colorPicker) {
    // Convert color to hex if needed
    els.colorPicker.value = toHex(color);
    setStatus(`${t('status.pickedColor')} ${color}`);
  }
}

function toHex(color) {
  if (!color || color.startsWith('#')) return color || '#000000';
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const ctx = tmp.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
}
