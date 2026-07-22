/**
 * Tooltip Utility
 * 
 * Module duy nhất quản lý custom tooltip behavior.
 * 
 * @module shared/dom/tooltip-utils
 * 
 * @example
 * import { showCustomTooltip, hideCustomTooltip } from '../../shared/dom/tooltip-utils';
 * 
 * element.addEventListener('mouseenter', (e) => showCustomTooltip(e, 'My tooltip text'));
 * element.addEventListener('mouseleave', hideCustomTooltip);
 */

/**
 * Hiển thị custom tooltip tại vị trí cursor.
 * 
 * @param {Event} event - Mouse event
 * @param {string} text - Nội dung tooltip
 * @param {Object} [options] - Tùy chọn
 * @param {string} [options.tooltipId='custom-tooltip'] - ID của tooltip element
 */
export function showCustomTooltip(event, text, options = {}) {
  const { tooltipId = 'custom-tooltip' } = options;
  let tooltip = document.getElementById(tooltipId);
  
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = tooltipId;
    document.body.appendChild(tooltip);
  }
  
  tooltip.textContent = text;
  tooltip.classList.add('show');
  
  const x = event.clientX + 10;
  const y = event.clientY + 10;
  
  // Prevent overflow
  const rect = tooltip.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 10;
  const maxY = window.innerHeight - rect.height - 10;
  
  tooltip.style.left = Math.min(x, maxX) + 'px';
  tooltip.style.top = Math.min(y, maxY) + 'px';
}

/**
 * Ẩn custom tooltip.
 * 
 * @param {Object} [options] - Tùy chọn
 * @param {string} [options.tooltipId='custom-tooltip'] - ID của tooltip element
 */
export function hideCustomTooltip(options = {}) {
  const { tooltipId = 'custom-tooltip' } = options;
  const tooltip = document.getElementById(tooltipId);
  if (tooltip) {
    tooltip.classList.remove('show');
  }
}

/**
 * Ẩn tooltip khi unmount (dùng trong cleanup).
 * 
 * @param {Object} [options] - Tùy chọn
 * @param {string} [options.tooltipId='custom-tooltip'] - ID của tooltip element
 */
export function hideTooltipOnUnmount(options = {}) {
  const { tooltipId = 'custom-tooltip' } = options;
  const tooltip = document.getElementById(tooltipId);
  if (tooltip) {
    tooltip.classList.remove('show');
  }
}

/**
 * Thiết lập tooltip cho một element.
 * 
 * @param {HTMLElement} element - Element cần gắn tooltip
 * @param {string|Function} textOrGetter - Text hoặc function trả về text
 * @param {Object} [options] - Tùy chọn truyền cho showCustomTooltip
 * @returns {Function} Cleanup function
 * 
 * @example
 * const cleanup = setupTooltip(myButton, 'Click me!');
 * // Khi unmount:
 * cleanup();
 */
export function setupTooltip(element, textOrGetter, options = {}) {
  const getText = typeof textOrGetter === 'function' ? textOrGetter : () => textOrGetter;
  
  const handleMouseEnter = (e) => showCustomTooltip(e, getText(), options);
  const handleMouseLeave = () => hideCustomTooltip(options);
  const handleMouseMove = (e) => showCustomTooltip(e, getText(), options);
  
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);
  element.addEventListener('mousemove', handleMouseMove);
  
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.removeEventListener('mousemove', handleMouseMove);
    hideCustomTooltip(options);
  };
}