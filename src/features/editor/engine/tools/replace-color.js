import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus, setTaskUI } from '../core/state.js';
import { beginStroke, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { writePixel } from '../core/pixel-writer.js';
import { t } from '../../../../i18n/i18n.js';
import { startTask, completeTask } from '../core/task-manager.js';
import { asyncProcessChunks } from '../../../../shared/lib/async-utils.js';
import { uint32ToRgba, colorDistance } from '../core/color-utils.js';

export async function useReplaceColor(cell, newColorHex) {
  if (cell.x < 0 || cell.y < 0 || cell.x >= GRID_WIDTH || cell.y >= GRID_HEIGHT) return;

  const toleranceInput = document.getElementById('replaceTolerance');
  const tolerance = toleranceInput ? parseInt(toleranceInput.value, 10) || 0 : 0;
  
  const startIdx = cell.y * GRID_WIDTH + cell.x;
  const targetUint32 = pixelMap[startIdx];
  const targetRgba = uint32ToRgba(targetUint32);
  
  // Find all matching pixels
  const changes = [];
  for (let i = 0; i < pixelMap.length; i++) {
    const curUint32 = pixelMap[i];
    if (tolerance === 0) {
      if (curUint32 === targetUint32) {
        changes.push(i);
      }
    } else {
      if (curUint32 === 0 && targetUint32 !== 0) continue;
      const curRgba = uint32ToRgba(curUint32);
      const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, targetRgba.r, targetRgba.g, targetRgba.b, targetRgba.a);
      if (dist <= tolerance) {
        changes.push(i);
      }
    }
  }

  if (changes.length === 0) return;

  const signal = startTask();
  setTaskUI(true);

  try {
    setStatus(t('status.erasing'));
    beginStroke();
    
    await asyncProcessChunks(changes, (idx) => {
      const x = idx % GRID_WIDTH;
      const y = Math.floor(idx / GRID_WIDTH);
      writePixel(x, y, newColorHex, { noMirror: true });
    }, signal, (done, total) => {
      setStatus(`Thay thế màu: ${Math.round(done / total * 100)}%`);
      if (done % 50000 === 0) renderPixels();
    });

    commitStroke(pixelMap);
    renderPixels();
    setStatus(`Đã thay thế ${changes.length} điểm ảnh.`);
  } catch (err) {
    if (err.message === 'aborted') {
      commitStroke(pixelMap);
      renderPixels();
      setStatus(t('status.taskAborted'));
    } else {
      console.error(err);
      setStatus("Lỗi thay thế màu", true);
    }
  } finally {
    completeTask();
    setTaskUI(false);
  }
}
