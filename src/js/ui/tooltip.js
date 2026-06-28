export function initCustomTooltip() {
  const tooltip = document.getElementById('custom-tooltip');
  if (!tooltip) return;

  let hideTimer = null;

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tooltip]');
    if (!el) return;

    const text = el.getAttribute('data-tooltip');
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
