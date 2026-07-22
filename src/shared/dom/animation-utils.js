/**
 * Animation Utility
 * 
 * Module duy nhất quản lý animation UI trong JavaScript.
 * Phối hợp với animation-manager.css để bật/tắt animation toàn cục.
 * 
 * @module shared/dom/animation-utils
 * 
 * @example
 * import { withAnimation, setAnimationsEnabled, animateElement } from '../../shared/dom/animation-utils';
 * 
 * // Chạy animation trên element
 * animateElement(el, 'anim-fade-in', 300).then(() => console.log('Done'));
 * 
 * // Kiểm tra animation có được bật không
 * if (areAnimationsEnabled()) { ... }
 */

/**
 * Kiểm tra animation có được bật không.
 * Dựa trên class `.animations-disabled` trên <html>.
 * 
 * @returns {boolean}
 */
export function areAnimationsEnabled() {
  return !document.documentElement.classList.contains('animations-disabled');
}

/**
 * Bật/tắt animation toàn cục.
 * 
 * @param {boolean} enabled
 */
export function setAnimationsEnabled(enabled) {
  if (enabled) {
    document.documentElement.classList.remove('animations-disabled');
    document.documentElement.classList.add('animations-enabled');
  } else {
    document.documentElement.classList.remove('animations-enabled');
    document.documentElement.classList.add('animations-disabled');
  }
  localStorage.setItem('animationsEnabled', enabled ? '1' : '0');
}

/**
 * Khởi tạo trạng thái animation từ localStorage.
 */
export function initAnimationState() {
  const saved = localStorage.getItem('animationsEnabled');
  if (saved === '0') {
    document.documentElement.classList.add('animations-disabled');
  }
}

/**
 * Chạy animation CSS trên element và trả về Promise khi hoàn thành.
 * 
 * @param {HTMLElement} element - Element cần chạy animation
 * @param {string} className - Class animation (ví dụ: 'anim-fade-in')
 * @param {number} [duration] - Duration (ms), mặc định lấy từ CSS
 * @returns {Promise<void>}
 * 
 * @example
 * await animateElement(myModal, 'anim-modal-enter');
 */
export function animateElement(element, className, duration) {
  return new Promise((resolve) => {
    if (!element || !areAnimationsEnabled()) {
      resolve();
      return;
    }

    element.classList.add(className);

    const onEnd = () => {
      element.classList.remove(className);
      resolve();
    };

    if (duration) {
      setTimeout(onEnd, duration);
    } else {
      element.addEventListener('animationend', onEnd, { once: true });
      // Fallback timeout
      setTimeout(onEnd, 1000);
    }
  });
}

/**
 * Wrap một callback để chạy với animation (nếu được bật) hoặc chạy trực tiếp.
 * 
 * @param {Function} callback - Callback chính
 * @param {Object} [options] - Tùy chọn
 * @param {boolean} [options.force=false] - Bỏ qua kiểm tra animationsEnabled
 * @returns {Function} Wrapped function
 * 
 * @example
 * const handleClick = withAnimation(() => {
 *   // code chạy sau animation
 * }, { force: true });
 */
export function withAnimation(callback, options = {}) {
  return (...args) => {
    if (options.force || areAnimationsEnabled()) {
      // Có thể thêm delay animation ở đây nếu cần
      requestAnimationFrame(() => callback(...args));
    } else {
      callback(...args);
    }
  };
}

/**
 * Tạo CSS transition cho element.
 * 
 * @param {HTMLElement} element - Element cần transition
 * @param {Object} styles - Object chứa CSS properties và giá trị cuối
 * @param {number} [duration=200] - Duration (ms)
 * @returns {Promise<void>}
 * 
 * @example
 * await transitionElement(el, { opacity: '1', transform: 'scale(1)' }, 300);
 */
export function transitionElement(element, styles, duration = 200) {
  return new Promise((resolve) => {
    if (!element || !areAnimationsEnabled()) {
      Object.assign(element?.style || {}, styles);
      resolve();
      return;
    }

    element.style.transition = `all ${duration}ms ease`;
    Object.assign(element.style, styles);

    const onEnd = () => {
      element.style.transition = '';
      resolve();
    };

    element.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, duration + 50);
  });
}

/**
 * Làm mờ dần element và ẩn nó.
 * 
 * @param {HTMLElement} element
 * @param {number} [duration=200]
 * @returns {Promise<void>}
 */
export function fadeOut(element, duration = 200) {
  return transitionElement(element, { opacity: '0' }, duration).then(() => {
    element.style.display = 'none';
  });
}

/**
 * Hiện element và làm xuất hiện dần.
 * 
 * @param {HTMLElement} element
 * @param {string} [display='block']
 * @param {number} [duration=200]
 * @returns {Promise<void>}
 */
export function fadeIn(element, display = 'block', duration = 200) {
  element.style.display = display;
  element.style.opacity = '0';
  return transitionElement(element, { opacity: '1' }, duration);
}