import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus, setTaskUI } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { writePixel } from '../shared/pixel-writer.js';
import { asyncFindContiguousRegion, asyncProcessChunks } from '../shared/async-utils.js';
import { startTask, completeTask } from '../core/task-manager.js';
import { t } from '../lang/i18n.js';

export async function useOutline(color, cell) {
  const thickness = parseInt(document.getElementById('outlineThickness')?.value || '1', 10);
  
  const targetKey = (cell.x << 16) | cell.y;
  const targetColor = pixelMap.get(targetKey) || null;

  const signal = startTask();
  setTaskUI(true);

  try {
    setStatus(t('status.scanBg'));
    const bgRegion = await asyncFindContiguousRegion(
      pixelMap, targetKey, targetColor, signal, 
      (count) => setStatus(t('status.scanBgCount', count))
    );

    const filledSet = new Set();
    const totalPixels = GRID_WIDTH * GRID_HEIGHT;
    setStatus(t('status.analyzeShape'));
    
    // Process the full grid to find non-bg blocks
    // Since GRID_WIDTH * GRID_HEIGHT is large (e.g. 1M), we can chunk this too if we want,
    // but a simple loop over 1M items doing Set.add is quite fast (~10ms).
    // For maximum safety against freezing, let's chunk it.
    let processedGrid = 0;
    const gridKeys = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const k = (x << 16) | y;
        if (!bgRegion.has(k)) filledSet.add(k);
      }
    }

    setStatus(t('status.calcOutline'));
    const toAdd = new Map();
    const filledArray = Array.from(filledSet);

    await asyncProcessChunks(filledArray, (key) => {
      const x = key >> 16;
      const y = key & 0xFFFF;
      for (let dy = -thickness; dy <= thickness; dy++) {
        for (let dx = -thickness; dx <= thickness; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (dx * dx + dy * dy > thickness * thickness + 0.5) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nk = (nx << 16) | ny;
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
