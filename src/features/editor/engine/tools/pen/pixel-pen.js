import { GRID_WIDTH, GRID_HEIGHT } from '../../core/state.js';
import { writePixel } from '../../core/pixel-writer.js';
import { bresenhamLine } from '../../algorithms/line-algo.js';

export function usePixelPen(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('pixelPenSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 1 : 1;

  const writeSize = (cx, cy) => {
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

        const px = cx - offset + x;
        const py = cy - offset + y;

        if (px < 0 || py < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT) continue;
        
        writePixel(px, py, color);
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
