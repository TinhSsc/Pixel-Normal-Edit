import { setPreviewPixels } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';
import { bresenhamLine } from '../shared/line-algo.js';

let startCell = null;

export function useLineTool(event, cell, color, prevCell) {
  const thickness = parseInt(document.querySelector('.shape-thickness')?.value || '1', 10);

  if (event === 'down') {
    startCell = cell;
  } else if (event === 'move' && startCell) {
    const preview = [];
    bresenhamLine(startCell.x, startCell.y, cell.x, cell.y, (cx, cy) => {
      for (let dy = 0; dy < thickness; dy++) {
        for (let dx = 0; dx < thickness; dx++) {
          preview.push({ x: cx + dx, y: cy + dy, color });
        }
      }
    });
    setPreviewPixels(preview);
  } else if (event === 'up' && startCell) {
    bresenhamLine(startCell.x, startCell.y, cell.x, cell.y, (cx, cy) => {
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
