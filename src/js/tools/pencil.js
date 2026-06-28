import { pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';
import { bresenhamLine } from '../shared/line-algo.js';

export function usePencil(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('pencilSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 1 : 1;

  const writeSize = (cx, cy) => {
    const offset = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        writePixel(cx - offset + x, cy - offset + y, color);
      }
    }
  };

  if (event === 'down' || event === 'move') {
    if (prevCell && event === 'move') {
      bresenhamLine(prevCell.x, prevCell.y, cell.x, cell.y, (x, y) => {
        writeSize(x, y);
      });
    } else {
      writeSize(cell.x, cell.y);
    }
  }
}
