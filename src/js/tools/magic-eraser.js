import { pixelMap, setStatus, setTaskUI } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { asyncFloodFill, asyncProcessChunks } from '../shared/async-utils.js';
import { writePixel } from '../shared/pixel-writer.js';
import { t } from '../lang/i18n.js';
import { startTask, completeTask } from '../core/task-manager.js';
import { runWorkerTask } from '../workers/worker-manager.js';
import { GRID_WIDTH, GRID_HEIGHT, gridGeneration } from '../core/state.js';

export async function useMagicEraser(cell) {
  const signal = startTask();
  setTaskUI(true);
  const myGeneration = gridGeneration;

  try {
    setStatus(t('status.scanEraser') + ' (Worker)');
    const pixelCopy = new Uint32Array(pixelMap);
    
    let changedIndices = await runWorkerTask(null, 'magicEraser', {
      pixelMap: pixelCopy,
      startX: cell.x,
      startY: cell.y,
      tolerance: 30,
      width: GRID_WIDTH,
      height: GRID_HEIGHT
    });
    
    if (myGeneration !== gridGeneration) return;
    
    if (changedIndices.length === 0) return;

    setStatus(t('status.erasing'));
    beginStroke();
    
    await asyncProcessChunks(changedIndices, (idx) => {
      const x = idx % GRID_WIDTH;
      const y = Math.floor(idx / GRID_WIDTH);
      writePixel(x, y, null, { noMirror: true });
    }, signal, (done, total) => {
      setStatus(t('status.erasingPct', Math.round(done / total * 100)));
      if (done % 50000 === 0) renderPixels();
    });

    commitStroke(pixelMap);
    renderPixels();
    setStatus(t('status.eraserDone', changedIndices.length));
  } catch (err) {
    if (err.message === 'aborted') {
      commitStroke(pixelMap);
      renderPixels();
      setStatus(t('status.taskAborted'));
    } else {
      console.error(err);
      setStatus(t('status.eraserError'), true);
    }
  } finally {
    completeTask();
    setTaskUI(false);
  }
}
