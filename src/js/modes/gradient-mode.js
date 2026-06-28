import { setGradientModeActive, setGradientDirection } from '../shared/pixel-writer.js';

export function setupGradientMode() {
  const checkbox = document.getElementById('gradientMode');
  const select   = document.getElementById('gradientDirection');
  if (!checkbox || !select) return;

  checkbox.addEventListener('change', () => {
    setGradientModeActive(checkbox.checked);
    document.getElementById('gradientModeLabel')?.classList.toggle('active', checkbox.checked);
  });

  select.addEventListener('change', () => {
    setGradientDirection(select.value);
  });
}
