import { ctx, GRID_WIDTH, GRID_HEIGHT, pixelMap, previewPixels, offscreenImageData, offscreenData32, selectionBox, floatingSelection } from './state.js';
import { getZoom, getPan, applyTransform } from './viewport.js';
import { getCellPx } from './viewport.js';
import { syncPreviewPixels } from './preview-group-manager.js';
import { parseColorToUint32 } from './color-utils.js';
import { bresenhamLine } from '../algorithms/line-algo.js';
import { circlePoints } from '../algorithms/circle-algo.js';
import { isMirrorModeActive } from './pixel-writer.js';

let showGridFlag = true;

export function setShowGrid(val) {
  showGridFlag = val;
}

export function isShowGrid() {
  return showGridFlag;
}

let lastPreviewRect = null;
let forceFullRender = true;

export function setForceFullRender(val) {
  forceFullRender = val;
}

let cachedBrush = { thickness: 0, color: '', canvas: null };

function getBrush(thickness, color) {
  if (cachedBrush.thickness === thickness && cachedBrush.color === color) {
    return cachedBrush.canvas;
  }
  const canvas = document.createElement('canvas');
  canvas.width = thickness;
  canvas.height = thickness;
  const bctx = canvas.getContext('2d');
  bctx.fillStyle = color;
  bctx.fillRect(0, 0, thickness, thickness);
  cachedBrush = { thickness, color, canvas };
  return canvas;
}

function computeBoundingRect(pixels) {
  if (!pixels || (Array.isArray(pixels) && pixels.length === 0)) return null;
  
  if (!Array.isArray(pixels)) {
    const minX = Math.min(pixels.x1, pixels.x2);
    const maxX = Math.max(pixels.x1, pixels.x2);
    const minY = Math.min(pixels.y1, pixels.y2);
    const maxY = Math.max(pixels.y1, pixels.y2);
    
    if (pixels.type === 'stamped-rect') {
      const offset = Math.floor(pixels.thickness / 2);
      return { x: minX - offset, y: minY - offset, w: maxX - minX + pixels.thickness, h: maxY - minY + pixels.thickness };
    }
    if (pixels.type === 'stamped-line') {
      const offset = Math.floor(pixels.thickness / 2);
      return { x: minX - offset, y: minY - offset, w: maxX - minX + pixels.thickness, h: maxY - minY + pixels.thickness };
    }
    if (pixels.type === 'stamped-circle') {
      const offset = Math.floor(pixels.thickness / 2);
      const r = Math.sqrt((pixels.x2 - pixels.x1)**2 + (pixels.y2 - pixels.y1)**2);
      return { 
        x: Math.floor(pixels.x1 - r - offset), 
        y: Math.floor(pixels.y1 - r - offset), 
        w: Math.ceil(r * 2 + pixels.thickness), 
        h: Math.ceil(r * 2 + pixels.thickness) 
      };
    }
    return null;
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    
    if (isMirrorModeActive()) {
      const mx = GRID_WIDTH - 1 - p.x;
      if (mx < minX) minX = mx;
      if (mx > maxX) maxX = mx;
    }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function mergeRects(...rects) {
  const validRects = rects.filter(r => r !== null && r !== undefined);
  if (validRects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of validRects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.w - 1 > maxX) maxX = r.x + r.w - 1;
    if (r.y + r.h - 1 > maxY) maxY = r.y + r.h - 1;
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function clampRect(r, minX, minY, maxX, maxY) {
  const cx = Math.max(minX, r.x);
  const cy = Math.max(minY, r.y);
  const ex = Math.min(maxX - 1, r.x + r.w - 1);
  const ey = Math.min(maxY - 1, r.y + r.h - 1);
  return { x: cx, y: cy, w: ex - cx + 1, h: ey - cy + 1 };
}

export function renderPixels(isPreviewOnly = false) {
  if (!ctx || !offscreenImageData || !offscreenData32) return;

  if (!isPreviewOnly || forceFullRender) {
    // 1. FULL RENDER PATH
    offscreenData32.set(pixelMap);

    if (previewPixels) {
      for (let i = 0; i < previewPixels.length; i++) {
        const { x, y, color } = previewPixels[i];
        if (x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT) {
          offscreenData32[y * GRID_WIDTH + x] = parseColorToUint32(color);
        }
        if (isMirrorModeActive()) {
          const mx = GRID_WIDTH - 1 - x;
          if (mx >= 0 && mx < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            offscreenData32[y * GRID_WIDTH + mx] = parseColorToUint32(color);
          }
        }
      }
    }

    ctx.putImageData(offscreenImageData, 0, 0);

    drawFloatingSelection();
    drawSelectionBox();

    const selRect1 = selectionBox ? { x: selectionBox.x - 1, y: selectionBox.y - 1, w: selectionBox.width + 2, h: selectionBox.height + 2 } : null;
    const selRect2 = floatingSelection ? { x: floatingSelection.x - 1, y: floatingSelection.y - 1, w: floatingSelection.width + 2, h: floatingSelection.height + 2 } : null;
    lastPreviewRect = mergeRects(computeBoundingRect(previewPixels), selRect1, selRect2);
    forceFullRender = false;
    
    const mainCanvas = document.getElementById('pixelCanvas');
    syncPreviewPixels(mainCanvas, GRID_WIDTH, GRID_HEIGHT);
    return;
  }

  // 2. PARTIAL RENDER PATH (For fast preview drag)
  const selRect1 = selectionBox ? { x: selectionBox.x - 1, y: selectionBox.y - 1, w: selectionBox.width + 2, h: selectionBox.height + 2 } : null;
  const selRect2 = floatingSelection ? { x: floatingSelection.x - 1, y: floatingSelection.y - 1, w: floatingSelection.width + 2, h: floatingSelection.height + 2 } : null;
  const newPreviewRect = mergeRects(computeBoundingRect(previewPixels), selRect1, selRect2);
  let updateRect = mergeRects(lastPreviewRect, newPreviewRect);
  
  if (!updateRect) return;
  
  updateRect = clampRect(updateRect, 0, 0, GRID_WIDTH, GRID_HEIGHT);
  if (updateRect.w <= 0 || updateRect.h <= 0) return;

  // Restore pixels from pixelMap for the ENTIRE updateRect
  for (let y = updateRect.y; y < updateRect.y + updateRect.h; y++) {
    const rowOffset = y * GRID_WIDTH;
    for (let x = updateRect.x; x < updateRect.x + updateRect.w; x++) {
      offscreenData32[rowOffset + x] = pixelMap[rowOffset + x];
    }
  }

  // Apply previewPixels
  if (previewPixels) {
    for (let i = 0; i < previewPixels.length; i++) {
      const { x, y, color } = previewPixels[i];
      if (x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT) {
        offscreenData32[y * GRID_WIDTH + x] = parseColorToUint32(color);
      }
      if (isMirrorModeActive()) {
        const mx = GRID_WIDTH - 1 - x;
        if (mx >= 0 && mx < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          offscreenData32[y * GRID_WIDTH + mx] = parseColorToUint32(color);
        }
      }
    }
  }

  // Put only the dirty rectangle to the canvas
  ctx.putImageData(
    offscreenImageData, 
    0, 0, 
    updateRect.x, updateRect.y, updateRect.w, updateRect.h
  );

  // We need to redraw floating selection and selection box on partial updates too.
  // Because putImageData overwrites them. But since we just updated a partial rect,
  // we might clear parts of the selection border. For simplicity and robustness,
  // we can force full render of selection layers if they intersect updateRect.
  // Actually, putImageData just overwrites the updateRect. So we just re-draw over it.
  drawFloatingSelection();
  drawSelectionBox();

  drawStampedPreview();

  lastPreviewRect = newPreviewRect;

  const mainCanvas = document.getElementById('pixelCanvas');
  syncPreviewPixels(mainCanvas, GRID_WIDTH, GRID_HEIGHT);
}

function drawFloatingSelection() {
  if (!floatingSelection || !ctx) return;
  const { x, y, width, height, pixels } = floatingSelection;
  
  // We draw the floating pixels onto a temporary canvas, then drawImage it
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tctx = tempCanvas.getContext('2d');
  const timg = tctx.createImageData(width, height);
  const tdata32 = new Uint32Array(timg.data.buffer);
  
  for (let i = 0; i < pixels.length; i++) {
    tdata32[i] = pixels[i];
  }
  tctx.putImageData(timg, 0, 0);
  
  ctx.drawImage(tempCanvas, x, y);
}

function drawSelectionBox() {
  let box = selectionBox || (floatingSelection ? floatingSelection : null);
  const el = document.getElementById('selectionOverlay');
  if (!el) return;
  if (!box) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.style.left = `${(box.x / GRID_WIDTH) * 100}%`;
  el.style.top = `${(box.y / GRID_HEIGHT) * 100}%`;
  el.style.width = `${(box.width / GRID_WIDTH) * 100}%`;
  el.style.height = `${(box.height / GRID_HEIGHT) * 100}%`;
}

function drawStampedPreview() {
  if (!previewPixels || Array.isArray(previewPixels)) return;

  const p = previewPixels;
  const brushCanvas = getBrush(p.thickness, p.color);

  const offset = Math.floor(p.thickness / 2);

  const drawIt = (x1, y1, x2, y2) => {
    if (p.type === 'stamped-rect') {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      
      ctx.fillStyle = p.color;
      ctx.fillRect(minX - offset, minY - offset, w + p.thickness - 1, p.thickness); // top
      ctx.fillRect(minX - offset, maxY - offset, w + p.thickness - 1, p.thickness); // bottom
      ctx.fillRect(minX - offset, minY - offset + p.thickness, p.thickness, h - 1 - p.thickness); // left
      ctx.fillRect(maxX - offset, minY - offset + p.thickness, p.thickness, h - 1 - p.thickness); // right
    } else if (p.type === 'stamped-line') {
      bresenhamLine(x1, y1, x2, y2, (cx, cy) => {
        ctx.drawImage(brushCanvas, cx - offset, cy - offset);
      });
    } else if (p.type === 'stamped-circle') {
      const r = Math.round(Math.hypot(x2 - x1, y2 - y1));
      circlePoints(x1, y1, r, (cx, cy) => {
        ctx.drawImage(brushCanvas, cx - offset, cy - offset);
      });
    }
  };

  drawIt(p.x1, p.y1, p.x2, p.y2);
  if (isMirrorModeActive()) {
    const mx1 = GRID_WIDTH - 1 - p.x1;
    const mx2 = GRID_WIDTH - 1 - p.x2;
    drawIt(mx1, p.y1, mx2, p.y2);
  }
}
