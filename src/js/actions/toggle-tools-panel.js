import { t } from '../lang/i18n.js';

export function setupToggleToolsPanel() {
  const btn = document.getElementById('toggleToolsBtn');
  const layout = document.querySelector('.editor-layout');
  if (!btn || !layout) return;

  btn.addEventListener('click', () => {
    const hidden = layout.classList.toggle('tools-hidden');
    const iconStr = hidden ? 'menu' : 'eye-off';
    const txtKey = hidden ? 'text.showTools' : 'text.hideTools';
    btn.innerHTML = `<i data-lucide="${iconStr}" style="width:18px;height:18px;"></i> ${t(txtKey)}`;
    if (window.lucide) window.lucide.createIcons();
  });
}
