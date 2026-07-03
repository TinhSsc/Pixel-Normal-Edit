import { pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { writePixel } from '../shared/pixel-writer.js';
import { bresenhamLine } from '../shared/line-algo.js';
import { getActiveVariant } from '../tool-popup/popupState.js';
import { uint32ToRgba, rgbaToHex } from '../core/color-utils.js';

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
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

  if (hsv.v <= 0.2) {
    return c;
  }

  hsv.v = Math.min(1, hsv.v + (1 - hsv.v) * strength);
  return hsvToRgb(hsv.h, hsv.s, hsv.v);
}

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

export function usePencil(event, cell, color, prevCell) {
  const sizeInput = document.getElementById('pencilSize');
  const size = sizeInput ? parseInt(sizeInput.value) || 1 : 1;
  const variant = getActiveVariant('pencil', 'pixel-pen');

  const writeSize = (cx, cy) => {
    const offset = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = cx - offset + x;
        const py = cy - offset + y;

        if (px < 0 || py < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT) continue;

        if (variant === 'blend-brush') {
          const avgColor = getAverageColor(px, py, 1);
          if (avgColor) {
            const existingUint32 = pixelMap[py * GRID_WIDTH + px];
            const existingRgb = (existingUint32 && existingUint32 !== 0) ? uint32ToRgba(existingUint32) : { r: 255, g: 255, b: 255 };
            const blended = blendRgb(existingRgb, avgColor, 0.5);
            writePixel(px, py, rgbaToHex(Math.round(blended.r), Math.round(blended.g), Math.round(blended.b)));
          }
        } else if (variant === 'highlight-pen') {
          const existingUint32 = pixelMap[py * GRID_WIDTH + px];
          if (existingUint32 && existingUint32 !== 0) {
            const existingRgb = uint32ToRgba(existingUint32);
            const highlighted = highlightRgb(existingRgb);
            writePixel(px, py, rgbaToHex(highlighted.r, highlighted.g, highlighted.b));
          }
        } else {
          // Normal Pixel Pen
          writePixel(px, py, color);
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
