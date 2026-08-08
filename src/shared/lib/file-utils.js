/**
 * File Utilities - Hàm tiện ích xử lý file dùng chung cho mini tools
 */
import { FORMAT_REGISTRY } from '../image/format-registry.js';

/**
 * Điều hướng đến tool khác
 */
export function navigate(path) {
  window.location.href = `/${path}`;
}

/**
 * Validate file ảnh
 */
export function validateFile(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Chỉ hỗ trợ file ảnh: ${file.name}`);
  }

  return true;
}

/**
 * Kiểm tra file có cần chế độ nâng cao không
 */
export function isFileAdvanced(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const formatInfo = FORMAT_REGISTRY.find(f => f.ext === ext || file.type === f.id || (f.ext === 'jpg' && ext === 'jpeg'));
  return formatInfo ? formatInfo.advanced : false;
}