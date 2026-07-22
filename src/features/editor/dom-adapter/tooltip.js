import { t } from '../../../i18n/i18n.js';

export function initCustomTooltip() {
  const tooltip = document.getElementById('custom-tooltip');
  if (!tooltip) return;

  let hideTimer = null;

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tooltip], [title], [data-i18n^="tooltip."], [data-i18n^="tool."], [data-i18n^="transform."]');
    if (!el) return;

    let text = el.getAttribute('data-tooltip');

    // Migrate native title to custom tooltip
    if (!text && el.hasAttribute('title') && el.getAttribute('title').trim()) {
      text = el.getAttribute('title');
      el.removeAttribute('title');
      el.setAttribute('data-tooltip', text);
    }

    // Handle React elements that re-rendered and lost data-tooltip
    if (!text && el.hasAttribute('data-i18n')) {
      const key = el.getAttribute('data-i18n');
      if (key.startsWith('tooltip.') || key.startsWith('tool.') || key.startsWith('transform.')) {
        text = t(key);
        el.setAttribute('data-tooltip', text);
      }
    }

    if (!text) return;

    clearTimeout(hideTimer);
    tooltip.textContent = text;
    tooltip.classList.add('show');

    const rect = el.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;

    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltip.offsetWidth - 8));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  });

  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-tooltip]');
    if (!el) return;
    hideTimer = setTimeout(() => tooltip.classList.remove('show'), 100);
  });
}

