import { pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../../core/state.js';
import { writePixel } from '../../shared/pixel-writer.js';
import { bresenhamLine } from '../../shared/line-algo.js';
import { uint32ToRgba, rgbaToHex } from '../../core/color-utils.js';

function blendRgb(c1, c2, ratio = 0.5) {
  if (!c1 && !c2) return null;
  if (!c1) return c2;
  if (!c2) return c1;

  return {
    r: c1.r * (1 - ratio) + c2.r * ratio,
    g: c1.g * (1 - ratio) + c2.g * ratio,
    b: c1.b * (1 - ratio) + c2.b * ratio
  };
}

function getAverageColor(x, y, radius = 1) {
  let r = 0, g = 0, b = 0, count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT) continue;
      const existingUint32 = pixelMap[py * GRID_WIDTH + px];
      if (existingUint32 && existingUint32 !== 0) {
        const rgba = uint32ToRgba(existingUint32);
        r += rgba.r; g += rgba.g; b += rgba.b;
        count++;
      }
    }
  }
  if (count === 0) return null;
  return { r: r / count, g: g / count, b: b / count };
}

export function useBlendBrush(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('blendBrushSize');
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

        const avgColor = getAverageColor(px, py, 1);
        if (avgColor) {
          const existingUint32 = pixelMap[py * GRID_WIDTH + px];
          const existingRgb = (existingUint32 && existingUint32 !== 0) ? uint32ToRgba(existingUint32) : { r: 255, g: 255, b: 255 };
          const blended = blendRgb(existingRgb, avgColor, 0.5);
          writePixel(px, py, rgbaToHex(Math.round(blended.r), Math.round(blended.g), Math.round(blended.b)));
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
