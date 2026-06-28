import { setMirrorModeActive } from '../shared/pixel-writer.js';

export function setupMirrorMode() {
  const checkbox = document.getElementById('mirrorMode');
  if (!checkbox) return;

  checkbox.addEventListener('change', () => {
    setMirrorModeActive(checkbox.checked);
    document.getElementById('mirrorModeLabel')?.classList.toggle('active', checkbox.checked);
    
    const mirrorLine = document.getElementById('mirrorLine');
    if (mirrorLine) {
      mirrorLine.style.display = checkbox.checked ? 'block' : 'none';
    }
  });
}
