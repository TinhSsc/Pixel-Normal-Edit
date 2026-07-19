import { pixelMap, setStatus, setTaskUI } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { asyncFloodFill, asyncProcessChunks } from '../../../../shared/lib/async-utils.js';
import { writePixel } from '../core/pixel-writer.js';
import { t } from '../../../../i18n/i18n.js';
import { startTask, completeTask } from '../core/task-manager.js';
import { runWorkerTask } from '../workers/worker-manager.js';
import { parseColorToUint32 } from '../core/color-utils.js';
import { GRID_WIDTH, GRID_HEIGHT, gridGeneration } from '../core/state.js';

export async function useFill(cell, color) {
  const signal = startTask();
  setTaskUI(true);
  const myGeneration = gridGeneration;
  
  try {
    setStatus(t('status.scanFill') + ' (Worker)');
    const fillUint32 = parseColorToUint32(color);
    const pixelCopy = new Uint32Array(pixelMap);
    
    let changedIndices = await runWorkerTask(null, 'floodFill', {
      pixelMap: pixelCopy,
      startX: cell.x,
      startY: cell.y,
      fillUint32,
      tolerance: 0,
      width: GRID_WIDTH,
      height: GRID_HEIGHT
    });
    
    if (myGeneration !== gridGeneration) return;
    
    if (changedIndices.length === 0) return;

    setStatus(t('status.filling'));
    beginStroke();
    
    await asyncProcessChunks(changedIndices, (idx) => {
      const x = idx % GRID_WIDTH;
      const y = Math.floor(idx / GRID_WIDTH);
      writePixel(x, y, color, { noMirror: true });
    }, signal, (done, total) => {
      setStatus(t('status.fillingPct', Math.round(done / total * 100)));
      if (done % 50000 === 0) renderPixels();
    });

    commitStroke(pixelMap);
    renderPixels();
    setStatus(t('status.fillComplete') + ` (${changedIndices.length} pixels)`);
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
