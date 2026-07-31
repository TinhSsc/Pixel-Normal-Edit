import { pixelMap, els, setStatus } from '../core/state.js';
import { undo, redo } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../../../../i18n/i18n.js';
import { debouncedSaveWorkspace } from '../core/tab-manager.js';

import { handleSelectUndo } from '../tools/select.js';

export function setupUndo() {
  els.undoBtns?.forEach(btn => btn.addEventListener('click', () => {
    if (handleSelectUndo()) return;
    const did = undo(pixelMap, renderPixels);
    if (did) {
      setStatus(t('status.undo'));
      debouncedSaveWorkspace();
    }
  }));
}

export function setupRedo() {
  els.redoBtns?.forEach(btn => btn.addEventListener('click', () => {
    const did = redo(pixelMap, renderPixels);
    if (did) {
      setStatus(t('status.redo'));
      debouncedSaveWorkspace();
    }
  }));
}
