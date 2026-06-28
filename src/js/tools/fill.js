import { pixelMap, setStatus, setTaskUI } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { asyncFloodFill, asyncProcessChunks } from '../shared/async-utils.js';
import { writePixel } from '../shared/pixel-writer.js';
import { t } from '../lang/i18n.js';
import { startTask, completeTask } from '../core/task-manager.js';

export async function useFill(cell, color) {
  const signal = startTask();
  setTaskUI(true);
  
  try {
    setStatus(t('status.scanFill'));
    const changed = await asyncFloodFill(pixelMap, cell.x, cell.y, color, 0, signal, (count) => {
      setStatus(t('status.scanFillCount', count));
    });

    if (changed.size === 0) return;

    setStatus(t('status.filling'));
    beginStroke();
    
    const changedArray = Array.from(changed.values());
    await asyncProcessChunks(changedArray, ({ x, y, newColor }) => {
      writePixel(x, y, newColor, { noMirror: true });
    }, signal, (done, total) => {
      setStatus(t('status.fillingPct', Math.round(done / total * 100)));
      if (done % 50000 === 0) renderPixels();
    });

    commitStroke(pixelMap);
    renderPixels();
    setStatus(t('status.fillComplete') + ` (${changed.size} pixels)`);
  } catch (err) {
    if (err.message === 'aborted') {
      commitStroke(pixelMap);
      renderPixels();
      setStatus(t('status.taskAborted'));
    } else {
      console.error(err);
      setStatus(t('status.fillError'), true);
    }
  } finally {
    completeTask();
    setTaskUI(false);
  }
}
