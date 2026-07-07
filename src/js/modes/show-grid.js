import { applyTransform } from '../core/viewport.js';
import { setShowGrid } from '../core/render.js';

let isSetup = false;
export function setupShowGrid() {
  if (isSetup) return;
  isSetup = true;

  document.body.addEventListener('change', (e) => {
    if (e.target.id === 'showGrid') {
      document.getElementById('showGridLabel')?.classList.toggle('active', e.target.checked);
      setShowGrid(e.target.checked);
      applyTransform(document.getElementById('pixelCanvas'));
    }
  });
}
