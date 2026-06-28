import { els } from '../core/state.js';

export function setupSwapColors() {
  const btn = document.getElementById('swapColorsBtn');
  if (btn) {
    btn.onclick = () => {
      const a = els.colorPicker?.value;
      const b = els.colorPicker2?.value;
      if (els.colorPicker && els.colorPicker2) {
        els.colorPicker.value = b;
        els.colorPicker2.value = a;
      }
    };
  }
}
