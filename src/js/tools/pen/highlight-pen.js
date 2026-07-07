import { pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../../core/state.js';
import { writePixel } from '../../shared/pixel-writer.js';
import { bresenhamLine } from '../../shared/line-algo.js';
import { uint32ToRgba, rgbaToHex } from '../../core/color-utils.js';

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function highlightRgb(c, strength = 0.2) {
  const hsv = rgbToHsv(c.r, c.g, c.b);
  if (hsv.v <= 0.2) return c;
  hsv.v = Math.min(1, hsv.v + (1 - hsv.v) * strength);
  return hsvToRgb(hsv.h, hsv.s, hsv.v);
}

export function useHighlightPen(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('highlightPenSize');
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

        const existingUint32 = pixelMap[py * GRID_WIDTH + px];
        if (existingUint32 && existingUint32 !== 0) {
          const existingRgb = uint32ToRgba(existingUint32);
          const highlighted = highlightRgb(existingRgb);
          writePixel(px, py, rgbaToHex(highlighted.r, highlighted.g, highlighted.b));
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
