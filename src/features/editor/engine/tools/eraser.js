import { writePixel } from '../core/pixel-writer.js';
import { bresenhamLine } from '../algorithms/line-algo.js';

export function useEraser(event, cell, prevCell) {
  const sizeInput = document.getElementById('eraserSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 1 : 1;

  const eraseSize = (cx, cy) => {
    const offset = Math.floor(size / 2);
    const shapeInput = document.getElementById('globalPenShape');
    const shape = shapeInput ? shapeInput.value : 'circle';

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (shape === 'circle' && size > 2) {
          const centerX = (size - 1) / 2;
          const centerY = (size - 1) / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          const radius = (size / 2) - 0.1;
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        writePixel(cx - offset + x, cy - offset + y, null);
      }
    }
  };

  if (event === 'down' || event === 'move') {
    if (prevCell && event === 'move') {
      bresenhamLine(prevCell.x, prevCell.y, cell.x, cell.y, (x, y) => {
        eraseSize(x, y);
      });
    } else {
      eraseSize(cell.x, cell.y);
    }
  }
}
