import { pixelMap, els, setStatus } from '../core/state.js';
import { undo, redo } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../lang/i18n.js';

export function setupUndo() {
  els.undoBtns?.forEach(btn => btn.addEventListener('click', () => {
    const did = undo(pixelMap, renderPixels);
    if (did) setStatus(t('status.undo'));
  }));

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      const did = undo(pixelMap, renderPixels);
      if (did) setStatus(t('status.undo'));
    }
  });
}

export function setupRedo() {
  els.redoBtns?.forEach(btn => btn.addEventListener('click', () => {
    const did = redo(pixelMap, renderPixels);
    if (did) setStatus(t('status.redo'));
  }));

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      const did = redo(pixelMap, renderPixels);
      if (did) setStatus(t('status.redo'));
    }
  });
}
