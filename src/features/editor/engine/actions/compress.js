import { els, setStatus, GRID_WIDTH, GRID_HEIGHT, pixelMap } from '../core/state.js';
import { t } from '../../../../i18n/i18n.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { parseColorToUint32 } from '../core/color-utils.js';
import { renderPixels } from '../core/render.js';

export function setupCompress() {
  els.compressBtn?.addEventListener('click', async () => {
    if (!els.imagePreview || !els.imagePreview.src || els.imagePreview.style.display === 'none') {
      setStatus(t('status.needImg'), true);
      return;
    }

    setStatus(t('status.compressing'));

    try {
      const img = els.imagePreview;
      const canvas = document.createElement('canvas');
      canvas.width = GRID_WIDTH;
      canvas.height = GRID_HEIGHT;
      const ctx = canvas.getContext('2d');
      // Draw image scaled down to the grid size
      ctx.drawImage(img, 0, 0, GRID_WIDTH, GRID_HEIGHT);

      const imgData = ctx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT);

      beginStroke(pixelMap);
      
      let changed = false;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const idx = y * GRID_WIDTH + x;
          const px = (y * GRID_WIDTH + x) * 4;
          const a = imgData.data[px + 3];

          if (a > 128) {
            const r = imgData.data[px];
            const g = imgData.data[px + 1];
            const b = imgData.data[px + 2];
            const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
            const clr = parseColorToUint32(hex);
            if (pixelMap[idx] !== clr) {
              pixelMap[idx] = clr;
              changed = true;
            }
          }
        }
      }
      
      commitStroke(pixelMap);
      if (changed) {
        renderPixels();
      }
      
      setStatus(t('status.compressed'));setTimeout(() => setStatus(t('status.imgComplete')), 1000);
    } catch (err) {
      setStatus(t('status.imgProcessing'), true);
    }
  });
}
