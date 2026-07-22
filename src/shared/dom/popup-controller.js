/**
 * Popup Controller
 * 
 * Module duy nhất quản lý popup UI (tool-with-popup pattern).
 * Tránh lặp code xử lý mouseenter/mouseleave/click cho popup ở nhiều nơi.
 * 
 * @module shared/dom/popup-controller
 * 
 * @example
 * import { initPopupBehavior, initMobilePopupTriggers } from '../../shared/dom/popup-controller';
 * 
 * // Kích hoạt popup cho header
 * initPopupBehavior('.header .tool-with-popup-bottom', { delay: 3000 });
 * 
 * // Thêm nút mobile trigger cho toolbar
 * initMobilePopupTriggers('.toolbar');
 */

/**
 * Khởi tạo behavior hover/click cho popup (tool-with-popup-bottom pattern).
 * 
 * @param {string} selector - CSS selector cho các wrapper element
 * @param {Object} [options] - Tùy chọn
 * @param {number} [options.delay=3000] - Delay (ms) khi click để giữ popup mở
 * @param {string} [options.popupSelector='.popup-bridge-bottom'] - Selector cho popup element
 * @param {string} [options.activeClass='show-popup'] - Class khi popup active
 * @returns {Function} Cleanup function để gỡ bỏ event listeners
 * 
 * @example
 * const cleanup = initPopupBehavior('.toolbar .tool-with-popup-bottom');
 * // Khi unmount:
 * cleanup();
 */
export function initPopupBehavior(selector, options = {}) {
  const {
    delay = 3000,
    popupSelector = '.popup-bridge-bottom',
    activeClass = 'show-popup'
  } = options;

  const handleMouseEnter = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    clearTimeout(wrapper._hideTimer);
    const popup = wrapper.querySelector(popupSelector);
    if (!popup) return;

    popup.style.display = 'block';
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.right = 'auto';

    const updatePosition = () => {
      const rect = wrapper.getBoundingClientRect();
      popup.style.top = (rect.bottom + 5) + 'px';
      
      let left = rect.left;
      const popupRect = popup.getBoundingClientRect();
      if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 10;
      }
      popup.style.left = left + 'px';
    };

    updatePosition();
    wrapper._updatePosition = updatePosition;
    const container = wrapper.closest('.header');
    if (container) {
      container.addEventListener('scroll', updatePosition, { passive: true });
      wrapper._scrollContainer = container;
    }
  };

  const handleMouseLeave = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    const popup = wrapper.querySelector(popupSelector);
    if (!popup) return;

    const hideDelay = (wrapper.dataset.clicked === 'true' || wrapper.contains(document.activeElement))
      ? delay
      : 0;

    wrapper._hideTimer = setTimeout(() => {
      wrapper.dataset.clicked = 'false';
      resetPopupStyles(popup, wrapper);
    }, hideDelay);
  };

  const handleClick = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    wrapper.dataset.clicked = 'true';
    clearTimeout(wrapper._hideTimer);
  };

  const handleClickOutside = (e) => {
    const wrappers = document.querySelectorAll(selector);
    wrappers.forEach(wrapper => {
      if (wrapper.dataset.clicked === 'true' && !wrapper.contains(e.target)) {
        wrapper.dataset.clicked = 'false';
        const popup = wrapper.querySelector(popupSelector);
        if (popup) {
          resetPopupStyles(popup, wrapper);
        }
      }
    });
  };

  // Attach events
  const wrappers = document.querySelectorAll(selector);
  wrappers.forEach(w => {
    w.addEventListener('mouseenter', handleMouseEnter);
    w.addEventListener('mouseleave', handleMouseLeave);
    w.addEventListener('click', handleClick);
  });

  document.addEventListener('click', handleClickOutside);

  // Return cleanup function
  return () => {
    const currentWrappers = document.querySelectorAll(selector);
    currentWrappers.forEach(w => {
      w.removeEventListener('mouseenter', handleMouseEnter);
      w.removeEventListener('mouseleave', handleMouseLeave);
      w.removeEventListener('click', handleClick);
      clearTimeout(w._hideTimer);
      if (w._updatePosition && w._scrollContainer) {
        w._scrollContainer.removeEventListener('scroll', w._updatePosition);
      }
    });
    document.removeEventListener('click', handleClickOutside);
  };
}

/**
 * Reset popup styles về mặc định.
 * @private
 */
function resetPopupStyles(popup, wrapper) {
  popup.style.display = '';
  popup.style.position = '';
  popup.style.zIndex = '';
  popup.style.top = '';
  popup.style.left = '';
  popup.style.right = '';
  
  if (wrapper._updatePosition && wrapper._scrollContainer) {
    wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
  }
}

/**
 * Thêm nút mobile trigger ("…") cho tất cả tool-with-popup trong container.
 * 
 * @param {string} containerSelector - CSS selector cho container (ví dụ: '.toolbar', '.right-panel')
 * @param {Object} [options] - Tùy chọn
 * @param {string} [options.triggerText='…'] - Text cho nút trigger
 * @param {string} [options.triggerClass='mobile-popup-trigger'] - Class cho nút trigger
 * @param {string} [options.activeClass='show-popup'] - Class khi popup active
 * 
 * @example
 * initMobilePopupTriggers('.toolbar');
 * initMobilePopupTriggers('.right-panel');
 */
export function initMobilePopupTriggers(containerSelector, options = {}) {
  const {
    triggerText = '…',
    triggerClass = 'mobile-popup-trigger',
    activeClass = 'show-popup',
  } = options;

  const popupSelectors = [
    '.tool-with-popup',
    '.tool-with-popup-left',
    '.tool-with-popup-bottom'
  ];

  const selector = popupSelectors.map(s => `${containerSelector} ${s}`).join(', ');
  const wrappers = document.querySelectorAll(selector);

  wrappers.forEach(wrapper => {
    if (wrapper.querySelector(`.${triggerClass}`)) return;
    
    const trigger = document.createElement('button');
    trigger.className = triggerClass;
    trigger.textContent = triggerText;
    wrapper.appendChild(trigger);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains(activeClass);
      document.querySelectorAll(`.${activeClass}`).forEach(w => w.classList.remove(activeClass));
      if (!isOpen) wrapper.classList.add(activeClass);
    });
  });
}

/**
 * Khởi tạo đầy đủ popup behavior (hover + mobile trigger) cho một container.
 * 
 * @param {string} containerSelector - CSS selector cho container
 * @param {Object} [options] - Tùy chọn
 * @returns {Function} Cleanup function
 * 
 * @example
 * const cleanup = setupFullPopupBehavior('.toolbar');
 */
export function setupFullPopupBehavior(containerSelector, options = {}) {
  const cleanupHover = initPopupBehavior(`${containerSelector} .tool-with-popup-bottom`, options);
  initMobilePopupTriggers(containerSelector, options);
  return cleanupHover;
}