import { pixelMap, els, setStatus, GRID_WIDTH } from '../core/state.js';
import { t } from '../lang/i18n.js';
import { uint32ToRgba, rgbaToHex } from '../core/color-utils.js';

export function usePicker(cell) {
  const idx = cell.y * GRID_WIDTH + cell.x;
  const val = pixelMap[idx];
  if (val !== 0 && els.colorPicker) {
    const rgba = uint32ToRgba(val);
    const hex = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    // HTML5 color input only accepts #RRGGBB (6 hex digits)
    const hex6 = hex.length > 7 ? hex.slice(0, 7) : hex;
    els.colorPicker.value = hex6;
    els.colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
    setStatus(`${t('status.pickedColor')} ${hex6}`);
  }
}
