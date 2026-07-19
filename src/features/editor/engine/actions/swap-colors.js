import { els } from '../core/state.js';

export function setupSwapColors() {
  const btn = document.getElementById('swapColorsBtn');
  if (btn) {
    btn.onclick = () => {
      if (els.colorPicker && els.colorPicker2) {
        const a = els.colorPicker.value;
        const b = els.colorPicker2.value;
        els.colorPicker.value = b;
        els.colorPicker2.value = a;
        els.colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
        els.colorPicker2.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
  }
}
