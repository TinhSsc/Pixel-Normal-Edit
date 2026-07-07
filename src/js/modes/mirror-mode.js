import { setMirrorModeActive } from '../shared/pixel-writer.js';

let isSetup = false;
export function setupMirrorMode() {
  if (isSetup) return;
  isSetup = true;

  document.body.addEventListener('change', (e) => {
    if (e.target.id === 'mirrorMode') {
      setMirrorModeActive(e.target.checked);
      document.getElementById('mirrorModeLabel')?.classList.toggle('active', e.target.checked);
      
      const mirrorLine = document.getElementById('mirrorLine');
      if (mirrorLine) {
        mirrorLine.style.display = e.target.checked ? 'block' : 'none';
      }
    }
  });
}
