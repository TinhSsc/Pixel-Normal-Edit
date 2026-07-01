import { els, pixelMap, GRID_WIDTH, GRID_HEIGHT, previewPixels } from '../core/state.js';
import { beginStroke, recordChange, commitStroke } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { parseColorToRgba, parseColorToUint32 } from '../core/color-utils.js';

// gradientMode and mirrorMode state
let gradientModeActive = false;
let mirrorModeActive = false;
let gradientDirection = 'vertical';

export function setGradientModeActive(v) { gradientModeActive = v; }
export function setMirrorModeActive(v)   { mirrorModeActive = v; }
export function isMirrorModeActive()     { return mirrorModeActive; }
export function setGradientDirection(v)  { gradientDirection = v; }

export function writePixel(x, y, color, options = {}) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return;

  const { alpha = 1, noMirror = false } = options;
  const key = (x << 16) | y;

  let finalColor = color;

  // Apply gradient alpha
  if (gradientModeActive && finalColor && finalColor !== 'transparent') {
    let gAlpha = 1;
    if (gradientDirection === 'vertical') {
      gAlpha = 1 - (y / Math.max(1, GRID_HEIGHT - 1));
    } else if (gradientDirection === 'horizontal') {
      gAlpha = 1 - (x / Math.max(1, GRID_WIDTH - 1));
    } else if (gradientDirection === 'diagonal') {
      gAlpha = 1 - ((x / GRID_WIDTH + y / GRID_HEIGHT) / 2);
    } else if (gradientDirection === 'radial') {
      const cx = GRID_WIDTH / 2; const cy = GRID_HEIGHT / 2;
      const dist = Math.sqrt((x - cx)**2 + (y - cy)**2);
      const maxDist = Math.sqrt(cx**2 + cy**2);
      gAlpha = 1 - (dist / maxDist);
    }
    const primary = els.colorPicker?.value || '#000000';
    const secondary = els.colorPicker2?.value || '#ffffff';
    const otherColor = (color === primary) ? secondary : primary;

    finalColor = interpolateColor(color, otherColor, gAlpha, options.alpha || 1);
  } else if (options.alpha !== undefined && options.alpha !== 1) {
    finalColor = interpolateColor(color, color, 1, options.alpha);
  }

  const finalColorUint32 = (finalColor && finalColor !== 'transparent') ? parseColorToUint32(finalColor) : 0;
  const idx = y * GRID_WIDTH + x;
  
  // Mirror mode
  if (mirrorModeActive && !noMirror) {
    const mx = GRID_WIDTH - 1 - x;
    writePixel(mx, y, finalColor, { alpha, noMirror: true });
  }

  const oldColorUint32 = pixelMap[idx];
  if (oldColorUint32 === finalColorUint32) return;

  recordChange(idx, oldColorUint32, finalColorUint32);
  pixelMap[idx] = finalColorUint32;
}

function interpolateColor(color1, color2, weight, globalAlpha = 1) {
  if (!color1 || color1 === 'transparent') return color1;
  if (!color2 || color2 === 'transparent') color2 = color1;

  const c1 = parseColorToRgba(color1);
  const c2 = parseColorToRgba(color2);

  const r = Math.round(c1.r * weight + c2.r * (1 - weight));
  const g = Math.round(c1.g * weight + c2.g * (1 - weight));
  const b = Math.round(c1.b * weight + c2.b * (1 - weight));
  const a = Math.round((c1.a * weight + c2.a * (1 - weight)) * globalAlpha);

  return `rgba(${r},${g},${b},${a / 255})`;
}
