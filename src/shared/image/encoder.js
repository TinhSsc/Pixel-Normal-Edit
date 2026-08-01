import { encodeImageWithAdvancedEngine } from './advanced-engine.js';
import { getFormatById } from './format-registry.js';
import { t } from '../../i18n/i18n.js';

export const encodeImage = async (canvas, formatId, quality, advancedModeEnabled) => {
  const formatInfo = getFormatById(formatId);
  if (!formatInfo) throw new Error(t('encoder.invalidFormat'));

  if (formatInfo.advanced && !advancedModeEnabled) {
    throw new Error(t('encoder.advancedRequired', formatInfo.label));
  }

  // Nếu là Native Formats (PNG, JPG, WebP, GIF, BMP)
  if (!formatInfo.advanced || !advancedModeEnabled) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(t('encoder.unsupportedBrowser')));
        }
      }, formatId, quality);
    });
  } else {
    // Advanced Formats (AVIF, TIFF, HEIC, etc.)
    return await encodeImageWithAdvancedEngine(canvas, formatInfo.ext, quality);
  }
};