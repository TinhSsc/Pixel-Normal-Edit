import { setPreviewPixels } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';

let startCell = null;

function getRectPixels(x0, y0, x1, y1, color, thickness = 1) {
  const pixels = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let x = minX; x <= maxX; x++) {
    for (let t = 0; t < thickness; t++) {
      pixels.push({ x, y: minY + t, color });
      pixels.push({ x, y: maxY - t, color });
    }
  }
  for (let y = minY + thickness; y <= maxY - thickness; y++) {
    for (let t = 0; t < thickness; t++) {
      pixels.push({ x: minX + t, y, color });
      pixels.push({ x: maxX - t, y, color });
    }
  }
  return pixels;
}

export function useRectTool(event, cell, color, prevCell) {
  const thickness = parseInt(document.querySelector('.shape-thickness')?.value || '1', 10);

  if (event === 'down') {
    startCell = cell;
  } else if (event === 'move' && startCell) {
    setPreviewPixels(getRectPixels(startCell.x, startCell.y, cell.x, cell.y, color, thickness));
  } else if (event === 'up' && startCell) {
    getRectPixels(startCell.x, startCell.y, cell.x, cell.y, color, thickness).forEach(({ x, y, color: c }) => {
      writePixel(x, y, c);
    });
    setPreviewPixels(null);
    startCell = null;
  }
}
