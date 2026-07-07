import { setGradientModeActive, setGradientDirection } from '../shared/pixel-writer.js';

let isSetup = false;
export function setupGradientMode() {
  if (isSetup) return;
  isSetup = true;

  document.body.addEventListener('change', (e) => {
    if (e.target.id === 'gradientMode') {
      setGradientModeActive(e.target.checked);
      document.getElementById('gradientModeLabel')?.classList.toggle('active', e.target.checked);
    } else if (e.target.id === 'gradientDirection') {
      setGradientDirection(e.target.value);
    }
  });
}
