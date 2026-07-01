import { setPreviewPixels } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';
import { bresenhamLine } from '../shared/line-algo.js';

let startCell = null;

export function useLineTool(event, cell, color, prevCell) {
  const thickness = parseInt(document.querySelector('.shape-thickness')?.value || '1', 10);

  if (event === 'down') {
    startCell = cell;
  } else if (event === 'move' && startCell) {
    if (thickness > 20) {
      setPreviewPixels({
        type: 'stamped-line',
        x1: startCell.x, y1: startCell.y,
        x2: cell.x, y2: cell.y,
        thickness, color
      });
    } else {
      const preview = [];
      const offset = Math.floor(thickness / 2);
      bresenhamLine(startCell.x, startCell.y, cell.x, cell.y, (cx, cy) => {
        for (let dy = 0; dy < thickness; dy++) {
          for (let dx = 0; dx < thickness; dx++) {
            preview.push({ x: cx - offset + dx, y: cy - offset + dy, color });
          }
        }
      });
      setPreviewPixels(preview);
    }
  } else if (event === 'up' && startCell) {
    const offset = Math.floor(thickness / 2);
    bresenhamLine(startCell.x, startCell.y, cell.x, cell.y, (cx, cy) => {
      for (let dy = 0; dy < thickness; dy++) {
        for (let dx = 0; dx < thickness; dx++) {
          writePixel(cx - offset + dx, cy - offset + dy, color);
        }
      }
    });
    setPreviewPixels(null);
    startCell = null;
  }
}
