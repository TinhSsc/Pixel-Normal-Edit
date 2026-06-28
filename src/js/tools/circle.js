import { setPreviewPixels } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';
import { circlePoints } from '../shared/circle-algo.js';

let startCell = null;

export function useCircleTool(event, cell, color, prevCell) {
  const thickness = parseInt(document.querySelector('.shape-thickness')?.value || '1', 10);

  if (event === 'down') {
    startCell = cell;
  } else if (event === 'move' && startCell) {
    const r = Math.round(Math.hypot(cell.x - startCell.x, cell.y - startCell.y));
    const preview = [];
    circlePoints(startCell.x, startCell.y, r, (cx, cy) => {
      for (let dy = 0; dy < thickness; dy++) {
        for (let dx = 0; dx < thickness; dx++) {
          preview.push({ x: cx + dx, y: cy + dy, color });
        }
      }
    });
    setPreviewPixels(preview);
  } else if (event === 'up' && startCell) {
    const r = Math.round(Math.hypot(cell.x - startCell.x, cell.y - startCell.y));
    circlePoints(startCell.x, startCell.y, r, (cx, cy) => {
      for (let dy = 0; dy < thickness; dy++) {
        for (let dx = 0; dx < thickness; dx++) {
          writePixel(cx + dx, cy + dy, color);
        }
      }
    });
    setPreviewPixels(null);
    startCell = null;
  }
}
