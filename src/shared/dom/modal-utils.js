/**
 * Modal Utility
 * 
 * Module duy nhất quản lý các thao tác modal phổ biến:
 * - Mở/đóng modal
 * - Click outside để đóng
 * - Quản lý overlay
 * 
 * @module shared/dom/modal-utils
 * 
 * @example
 * import { openModal, closeModal, setupClickOutside } from '../../shared/dom/modal-utils';
 * 
 * // Mở modal
 * openModal('myModal');
 * 
 * // Đóng modal
 * closeModal('myModal');
 * 
 * // Thiết lập click outside
 * setupClickOutside('myModal', () => closeModal('myModal'));
 */

/**
 * Mở một modal overlay.
 * 
 * @param {string|HTMLElement} modalIdOrEl - ID hoặc element của modal
 * @param {string} [displayStyle='flex'] - Giá trị display khi mở
 */
export function openModal(modalIdOrEl, displayStyle = 'flex') {
  const modal = typeof modalIdOrEl === 'string'
    ? document.getElementById(modalIdOrEl)
    : modalIdOrEl;
  
  if (!modal) return;
  modal.style.display = displayStyle;
}

/**
 * Đóng tất cả modal overlay.
 * 
 * @param {string|HTMLElement} [modalIdOrEl] - ID hoặc element của modal (nếu không cung cấp, đóng tất cả)
 */
export function closeModal(modalIdOrEl) {
  if (modalIdOrEl) {
    const modal = typeof modalIdOrEl === 'string'
      ? document.getElementById(modalIdOrEl)
      : modalIdOrEl;
    if (modal) modal.style.display = 'none';
  } else {
    // Đóng tất cả modal
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.style.display = 'none';
    });
  }
}

/**
 * Đóng tất cả modal overlay (alias cho closeModal() không tham số).
 */
export function closeAllModals() {
  closeModal();
}

/**
 * Thiết lập click outside để đóng modal.
 * 
 * @param {string|HTMLElement} modalIdOrEl - ID hoặc element của modal
 * @param {Function} [onClose] - Callback khi đóng modal
 * @returns {Function} Cleanup function
 * 
 * @example
 * const cleanup = setupClickOutside('downloadModal', () => closeModal('downloadModal'));
 * // Khi unmount:
 * cleanup();
 */
export function setupClickOutside(modalIdOrEl, onClose) {
  const modal = typeof modalIdOrEl === 'string'
    ? document.getElementById(modalIdOrEl)
    : modalIdOrEl;
  
  if (!modal) return () => {};

  const handler = (e) => {
    if (e.target === modal) {
      if (onClose) onClose();
    }
  };

  modal.addEventListener('click', handler);
  return () => modal.removeEventListener('click', handler);
}

/**
 * Mở modal và thiết lập click outside.
 * 
 * @param {string|HTMLElement} modalIdOrEl - ID hoặc element của modal
 * @param {Function} [onClose] - Callback khi đóng
 */
export function openModalWithOutsideClick(modalIdOrEl, onClose) {
  openModal(modalIdOrEl);
  setupClickOutside(modalIdOrEl, onClose || (() => closeModal(modalIdOrEl)));
}

/**
 * Mở modal và đóng tất cả modal khác trước.
 * 
 * @param {string} modalId - ID của modal cần mở
 */
export function openModalExclusive(modalId) {
  closeAllModals();
  openModal(modalId);
}