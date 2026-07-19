import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus, setTaskUI, gridGeneration } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { writePixel } from '../core/pixel-writer.js';
import { asyncFindContiguousRegion, asyncProcessChunks } from '../../../../shared/lib/async-utils.js';
import { startTask, completeTask } from '../core/task-manager.js';
import { t } from '../../../../i18n/i18n.js';

export async function useOutline(color, cell) {
  const thickness = parseInt(document.getElementById('outlineThickness')?.value || '1', 10);
  
  const targetIdx = cell.y * GRID_WIDTH + cell.x;
  const targetColorUint32 = pixelMap[targetIdx];

  const signal = startTask();
  setTaskUI(true);
  const myGeneration = gridGeneration;

  try {
    setStatus(t('status.scanBg'));
    // We pass targetColorUint32. We will also update asyncFindContiguousRegion to handle number.
    const bgRegion = await asyncFindContiguousRegion(
      pixelMap, cell.x, cell.y, targetColorUint32, signal, 
      (count) => setStatus(t('status.scanBgCount', count))
    );

    if (myGeneration !== gridGeneration) return;

    const filledSet = new Set();
    const totalPixels = GRID_WIDTH * GRID_HEIGHT;
    setStatus(t('status.analyzeShape'));
    
    let processedGrid = 0;
    const gridKeys = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const k = y * GRID_WIDTH + x;
        if (!bgRegion.has(k)) filledSet.add(k);
      }
    }

    setStatus(t('status.calcOutline'));
    const toAdd = new Map();
    const filledArray = Array.from(filledSet);

    await asyncProcessChunks(filledArray, (key) => {
      const x = key % GRID_WIDTH;
      const y = Math.floor(key / GRID_WIDTH);
      for (let dy = -thickness; dy <= thickness; dy++) {
        for (let dx = -thickness; dx <= thickness; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (dx * dx + dy * dy > thickness * thickness + 0.5) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nk = ny * GRID_WIDTH + nx;
          if (
            nx >= 0 && ny >= 0 && nx < GRID_WIDTH && ny < GRID_HEIGHT &&
            bgRegion.has(nk)
          ) {
            toAdd.set(nk, { x: nx, y: ny });
          }
        }
      }
    }, signal, (done, total) => {
      setStatus(t('status.calcOutlinePct', Math.round(done / total * 100)));
    }, 10000);

    if (myGeneration !== gridGeneration) return;

    beginStroke();
    
    const toAddArray = Array.from(toAdd.values());
    await asyncProcessChunks(toAddArray, ({ x, y }) => {
      writePixel(x, y, color, { noMirror: true });
    }, signal, (done, total) => {
      setStatus(t('status.drawOutlinePct', Math.round(done / total * 100)));
      if (done % 50000 === 0) renderPixels();
    });

    commitStroke(pixelMap);
    renderPixels();
    setStatus(t('status.outlineDone', toAdd.size));
    
  } catch (err) {
    if (err.message === 'aborted') {
      commitStroke(pixelMap); // Commit whatever was drawn so far
      renderPixels();
      setStatus(t('status.taskAborted'));
    } else {
      console.error(err);
      setStatus(t('status.outlineError'), true);
    }
  } finally {
    completeTask();
    setTaskUI(false);
  }
}
