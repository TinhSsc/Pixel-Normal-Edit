import { els, setStatus } from '../core/state.js';
import { zoomIn, zoomOut, fitToScreen } from '../core/viewport.js';
import { renderPixels } from '../core/render.js';
import { t } from '../lang/i18n.js';

export function setupZoomActions() {
  els.zoomInBtn?.addEventListener('click', () => {
    zoomIn();
    setStatus(`${t('status.zoom')} In`);
  });

  els.zoomOutBtn?.addEventListener('click', () => {
    zoomOut();
    setStatus(`${t('status.zoom')} Out`);
  });

  els.zoomResetBtn?.addEventListener('click', () => {
    fitToScreen();
    setStatus(t('status.zoomFit'));
  });
}
