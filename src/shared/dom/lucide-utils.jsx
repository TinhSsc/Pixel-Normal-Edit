/**
 * Lucide Icon Utility
 * 
 * Module duy nhất quản lý việc khởi tạo lại Lucide icons.
 * Tránh lặp code kiểm tra `window.lucide` ở nhiều nơi.
 * 
 * @module shared/dom/lucide-utils
 * 
 * @example
 * import { reloadLucideIcons, LucideIcon } from '../../shared/dom/lucide-utils';
 * reloadLucideIcons();
 */
import React from 'react';

/**
 * Component React LucideIcon dùng chung cho tất cả mini tools.
 * Thay thế các định nghĩa inline LucideIcon ở 7 file.
 */
export function LucideIcon({ name, width = 18, height = 18, className = '', style = {} }) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      dangerouslySetInnerHTML={{ __html: `<i data-lucide="${name}" width="${width}" height="${height}" class="${className}"></i>` }}
    />
  );
}

/**
 * Tạo lại tất cả Lucide icons trong DOM.
 * Gọi sau khi thêm HTML có chứa `data-lucide` attributes.
 * 
 * @param {number} [delay=0] - Delay (ms) trước khi tạo icons (mặc định 0)
 * @returns {Promise<void>}
 */
export function reloadLucideIcons(delay = 0) {
  return new Promise((resolve) => {
    const doReload = () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      resolve();
    };

    if (delay > 0) {
      setTimeout(doReload, delay);
    } else {
      doReload();
    }
  });
}

/**
 * Tạo HTML string cho một Lucide icon.
 * Dùng khi cần tạo icon qua innerHTML thay vì JSX.
 * 
 * @param {string} name - Tên icon (ví dụ: 'undo', 'redo', 'settings')
 * @param {Object} [options] - Tùy chọn
 * @param {number|string} [options.width=18] - Chiều rộng icon
 * @param {number|string} [options.height=18] - Chiều cao icon
 * @param {string} [options.className=''] - Class bổ sung
 * @param {string} [options.style=''] - Style inline bổ sung
 * @returns {string} HTML string
 * 
 * @example
 * const html = lucideIconHtml('undo', { width: 20, height: 20, className: 'spin' });
 * element.innerHTML = `<button>${html}</button>`;
 * reloadLucideIcons();
 */
export function lucideIconHtml(name, options = {}) {
  const { width = 18, height = 18, className = '', style = '' } = options;
  const classAttr = className ? ` class="${className}"` : '';
  const styleAttr = style ? ` style="${style}"` : '';
  return `<i data-lucide="${name}"${classAttr}${styleAttr} width="${width}" height="${height}"></i>`;
}

/**
 * Tạo button element với Lucide icon.
 * 
 * @param {string} iconName - Tên icon
 * @param {Object} [options] - Tùy chọn (xem lucideIconHtml)
 * @param {string[]} [options.classes] - Class array cho button
 * @param {Function} [options.onClick] - Click handler
 * @returns {HTMLElement} Button element
 * 
 * @example
 * const btn = createIconButton('undo', { 
 *   classes: ['btn', 'undo-btn-action'],
 *   onClick: () => handleUndo()
 * });
 * document.body.appendChild(btn);
 */
export function createIconButton(iconName, options = {}) {
  const btn = document.createElement('button');
  const { classes = [], onClick, width = 18, height = 18, className = '', style = '' } = options;
  
  btn.className = classes.join(' ');
  if (className) btn.className += ' ' + className;
  if (style) btn.style.cssText = style;
  
  btn.innerHTML = lucideIconHtml(iconName, { width, height });
  
  if (onClick) {
    btn.addEventListener('click', onClick);
  }
  
  return btn;
}
