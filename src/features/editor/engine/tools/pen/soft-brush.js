import { GRID_WIDTH, GRID_HEIGHT } from '../../core/state.js';
import { writePixel } from '../../core/pixel-writer.js';
import { bresenhamLine } from '../../algorithms/line-algo.js';

export function useSoftBrush(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('softBrushSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 3 : 3;

  const writeSize = (cx, cy) => {
    const offset = Math.floor(size / 2);
    const radius = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = cx - offset + x;
        const py = cy - offset + y;

        if (px < 0 || py < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT) continue;

        // Calculate distance from center of brush
        const centerX = (size - 1) / 2;
        const centerY = (size - 1) / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.hypot(dx, dy);

        // Calculate alpha based on distance (falloff effect)
        let alpha = 1;
        if (size > 1) {
          // Linear falloff
          alpha = Math.max(0, 1 - (dist / radius));
        }

        if (alpha > 0) {
          writePixel(px, py, color, { alpha });
        }
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
