import { els, setStatus, GRID_WIDTH, GRID_HEIGHT, pixelMap } from '../core/state.js';
import { t } from '../lang/i18n.js';

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

      const imageData = ctx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data;
      
      import('../core/history.js').then(({ beginStroke, commitStroke }) => {
        beginStroke();
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < GRID_WIDTH; x++) {
            const i = (y * GRID_WIDTH + x) * 4;
            const a = imageData[i + 3];
            if (a > 10) {
              const r = imageData[i];
              const g = imageData[i + 1];
              const b = imageData[i + 2];
              const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) + (a < 255 ? a.toString(16).padStart(2, '0') : '');
              pixelMap.set((x << 16) | y, hex);
            }
          }
        }
        commitStroke(pixelMap);
        import('../core/render.js').then(({ renderPixels }) => renderPixels());
        setStatus(t('status.compressing'));
        setTimeout(() => setStatus(t('status.imgComplete')), 1000);
      });
    } catch (err) {
      setStatus(t('status.imgProcessing'), true);
    }
  });
}
