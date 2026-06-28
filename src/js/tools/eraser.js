import { writePixel } from '../shared/pixel-writer.js';
import { bresenhamLine } from '../shared/line-algo.js';

export function useEraser(event, cell, prevCell) {
  const sizeInput = document.getElementById('eraserSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 1 : 1;

  const eraseSize = (cx, cy) => {
    const offset = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
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
