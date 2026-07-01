import { setPreviewPixels } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';

let startCell = null;

function getRectPixels(x0, y0, x1, y1, color, thickness = 1) {
  const pixels = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const offset = Math.floor(thickness / 2);
  for (let x = minX; x <= maxX; x++) {
    for (let t = 0; t < thickness; t++) {
      pixels.push({ x, y: minY - offset + t, color });
      pixels.push({ x, y: maxY - offset + t, color });
    }
  }
  for (let y = minY - offset + thickness; y <= maxY - offset - 1; y++) {
    for (let t = 0; t < thickness; t++) {
      pixels.push({ x: minX - offset + t, y, color });
      pixels.push({ x: maxX - offset + t, y, color });
    }
  }
  return pixels;
}

export function useRectTool(event, cell, color, prevCell) {
  const thickness = parseInt(document.querySelector('.shape-thickness')?.value || '1', 10);

  if (event === 'down') {
    startCell = cell;
  } else if (event === 'move' && startCell) {
    if (thickness > 20) {
      setPreviewPixels({
        type: 'stamped-rect',
        x1: startCell.x, y1: startCell.y,
        x2: cell.x, y2: cell.y,
        thickness, color
      });
    } else {
      setPreviewPixels(getRectPixels(startCell.x, startCell.y, cell.x, cell.y, color, thickness));
    }
  } else if (event === 'up' && startCell) {
    getRectPixels(startCell.x, startCell.y, cell.x, cell.y, color, thickness).forEach(({ x, y, color: c }) => {
      writePixel(x, y, c);
    });
    setPreviewPixels(null);
    startCell = null;
  }
}
