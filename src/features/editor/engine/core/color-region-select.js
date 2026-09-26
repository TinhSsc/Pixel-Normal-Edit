/**
 * color-region-select.js — Tìm vùng theo màu + lưu mask highlight
 *
 * Dùng cho "Chọn nhanh theo màu" trong panel Tỷ lệ vùng chọn:
 *   bấm vào 1 pixel → lan ra vùng liền kề cùng màu → lấy hình chữ nhật bao quanh.
 *
 * Module thuần: không DOM, không đọc state → test được độc lập.
 */

import { colorDistance, uint32ToRgba, parseUint32ToHex } from './color-utils.js';

const DEFAULT_MAX_PIXELS = 4000000;

// ── Mask highlight (chỉ render.js đọc) ──────────────────────────────────
let regionMask = null;
let regionMaskWidth = 0;
let regionMaskHeight = 0;

export function setQuickRegionMask(mask, width, height) {
  regionMask = mask && width > 0 && height > 0 ? mask : null;
  regionMaskWidth = width || 0;
  regionMaskHeight = height || 0;
}

export function getQuickRegionMask() {
  if (!regionMask) return null;
  return { mask: regionMask, width: regionMaskWidth, height: regionMaskHeight };
}

export function clearQuickRegionMask() {
  regionMask = null;
  regionMaskWidth = 0;
  regionMaskHeight = 0;
}

/**
 * Tìm vùng theo màu bắt đầu từ (startX, startY).
 *
 * @param {Uint32Array} pixelMap
 * @param {number} width
 * @param {number} height
 * @param {number} startX
 * @param {number} startY
 * @param {{tolerance?: number, contiguous?: boolean, maxPixels?: number}} options
 * @returns {null | {
 *   count: number,
 *   box: null | {x: number, y: number, width: number, height: number},
 *   colorHex: null | string,
 *   mask: Uint8Array,
 *   truncated: boolean,
 *   targetUint32: number
 * }}
 *   - box = null khi pixel bấm vào trong suốt (không thể chọn nền trống).
 *   - mask[i] = 1 tại mọi pixel thuộc vùng (dùng để tô highlight).
 */
export function findColorRegion(pixelMap, width, height, startX, startY, options = {}) {
  if (!pixelMap || width < 1 || height < 1) return null;

  const x0 = Math.round(Number(startX));
  const y0 = Math.round(Number(startY));
  if (!Number.isFinite(x0) || !Number.isFinite(y0)) return null;
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return null;

  const tolerance = Math.max(0, Number(options.tolerance) || 0);
  const contiguous = options.contiguous !== false;
  const maxPixels = Math.max(1, Math.min(
    DEFAULT_MAX_PIXELS,
    Number(options.maxPixels) || DEFAULT_MAX_PIXELS,
  ));

  const mask = new Uint8Array(width * height);
  const startIdx = y0 * width + x0;
  const target = pixelMap[startIdx];

  // Bấm vào ô trống → không có màu để "lan".
  if (target === 0) {
    return { count: 0, box: null, colorHex: null, mask, truncated: false, targetUint32: 0 };
  }

  const targetRgba = uint32ToRgba(target);
  const matches = (value) => {
    if (value === target) return true;
    if (tolerance === 0) return false;
    const rgba = uint32ToRgba(value);
    return colorDistance(
      rgba.r, rgba.g, rgba.b, rgba.a,
      targetRgba.r, targetRgba.g, targetRgba.b, targetRgba.a,
    ) <= tolerance;
  };

  let count = 0;
  let truncated = false;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const mark = (idx, x, y) => {
    mask[idx] = 1;
    count++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  if (contiguous) {
    // Lan 4 hướng, mask đóng vai trò "đã kiểm tra" (1 = thuộc vùng, 2 = không thuộc).
    const stack = [startIdx];
    while (stack.length > 0) {
      const idx = stack.pop();
      if (mask[idx]) continue;
      mask[idx] = 2;
      if (!matches(pixelMap[idx])) continue;

      const x = idx % width;
      const y = (idx - x) / width;
      mark(idx, x, y);

      if (count >= maxPixels) {
        truncated = true;
        break;
      }

      if (x + 1 < width) stack.push(idx + 1);
      if (x > 0) stack.push(idx - 1);
      if (y + 1 < height) stack.push(idx + width);
      if (y > 0) stack.push(idx - width);
    }
  } else {
    // Toàn cảnh: bắt mọi pixel cùng màu trên canvas.
    for (let idx = 0; idx < pixelMap.length; idx++) {
      if (!matches(pixelMap[idx])) continue;
      const x = idx % width;
      mark(idx, x, (idx - x) / width);
      if (count >= maxPixels) {
        truncated = true;
        break;
      }
    }
  }

  return {
    count,
    box: count > 0
      ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
      : null,
    colorHex: parseUint32ToHex(target),
    mask,
    truncated,
    targetUint32: target,
  };
}
