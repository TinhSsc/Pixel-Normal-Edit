import { applyTransform } from '../core/viewport.js';
import { setShowGrid } from '../core/render.js';

export function setupShowGrid() {
  const checkbox = document.getElementById('showGrid');
  if (!checkbox) return;

  checkbox.addEventListener('change', () => {
    document.getElementById('showGridLabel')?.classList.toggle('active', checkbox.checked);
    setShowGrid(checkbox.checked);
    applyTransform(document.getElementById('pixelCanvas'));
  });
}
