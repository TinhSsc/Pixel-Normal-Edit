import { encodeImageWithAdvancedEngine } from './advanced-engine.js';
import { getFormatById } from './format-registry.js';

export const encodeImage = async (canvas, formatId, quality, advancedModeEnabled) => {
  const formatInfo = getFormatById(formatId);
  if (!formatInfo) throw new Error("Định dạng không hợp lệ.");

  if (formatInfo.advanced && !advancedModeEnabled) {
    throw new Error(`Định dạng ${formatInfo.label} yêu cầu bật Chế độ Nâng cao (Advanced Mode).`);
  }

  // Nếu là Native Formats (PNG, JPG, WebP) và có thể AVIF trên một số browser
  if (!formatInfo.advanced || !advancedModeEnabled) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Trình duyệt không hỗ trợ xuất định dạng này. Vui lòng bật Chế độ Nâng cao."));
        }
      }, formatId, quality);
    });
  } else {
    // Advanced Formats
    return await encodeImageWithAdvancedEngine(canvas, formatInfo.ext, quality);
  }
};
