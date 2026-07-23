import { offscreenCanvas, offscreenCtx, offscreenImageData } from '../core/state.js';
import { beginStroke, commitStroke, recordChange } from '../core/history.js';
import { parseUint32ToHex, hexToUint32 } from '../core/color-utils.js';

export function previewRasterizeText(state, gridW, gridH) {
  const previewPixels = [];
  if (!state.text || state.text.trim().length === 0) return previewPixels;
  
  const { box, text, font, size, bold, italic, color } = state;
  if (!box || box.width <= 0 || box.height <= 0) return previewPixels;
  
  const w = Math.max(1, Math.round(box.width));
  const h = Math.max(1, Math.round(box.height));
  
  // Create offscreen canvas for rendering text
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  // We want pure pixel art, no anti-aliasing if possible
  // Canvas doesn't officially support no-antialias for text, but we can threshold it later.
  
  const fontString = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px "${font}"`;
  ctx.font = fontString;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  
  // Clear canvas
  ctx.clearRect(0, 0, box.width, box.height);
  
  // Word wrap logic
  const lines = text.split('\n');
  let y = 0;
  const lineHeight = size * 1.2;
  
  for (const line of lines) {
    if (y >= h) break; // clipping
    
    let words = line.split(' ');
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > w && i > 0) {
        ctx.fillText(currentLine, 0, y);
        currentLine = words[i] + ' ';
        y += lineHeight;
        if (y >= h) break; // clipping
      } else {
        currentLine = testLine;
      }
    }
    
    if (y < h) {
      ctx.fillText(currentLine, 0, y);
      y += lineHeight;
    }
  }
  
  // Read pixels and map to pixelMap
  const imgData = ctx.getImageData(0, 0, w, h);
  const data32 = new Uint32Array(imgData.data.buffer);
  
  // We don't need to parse color using canvas anymore
  // since we can use hexToUint32 or parseColorToUint32.

  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const srcIdx = iy * w + ix;
      const alpha = (data32[srcIdx] >> 24) & 0xff; // Get alpha channel safely
      
      if (alpha > 128) { // Threshold for anti-aliasing (no anti-aliasing)
        const py = Math.round(box.y) + iy;
        const px = Math.round(box.x) + ix;
        
        if (px >= 0 && px < gridW && py >= 0 && py < gridH) {
          previewPixels.push({ x: px, y: py, color: color });
        }
      }
    }
  }
  
  return previewPixels;
}

export function rasterizeText(state, pixelMap, gridW, gridH) {
  const preview = previewRasterizeText(state, gridW, gridH);
  if (!preview || preview.length === 0) return;

  // Convert color hex to uint32 color for pixelMap
  const finalColor32 = hexToUint32(state.color);

  beginStroke();
  let changed = false;

  for (const { x, y } of preview) {
    const dstIdx = y * gridW + x;
    if (pixelMap[dstIdx] !== finalColor32) {
      recordChange(dstIdx, pixelMap[dstIdx], finalColor32);
      pixelMap[dstIdx] = finalColor32;
      changed = true;
    }
  }

  commitStroke(pixelMap);
}
