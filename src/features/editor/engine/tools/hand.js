import { GRID_WIDTH, GRID_HEIGHT, pixelMap } from '../core/state.js';
import { getZoom, getPan } from '../core/viewport.js';
import { renderPixels } from '../core/render.js';
import { beginStroke, commitStroke, recordChange } from '../core/history.js';

let isDragging = false;
let startCell = null;
let originalPixelMap = null;
let bbox = null;
let dragCanvas = null;

export function useHandTool(event, cell, e) {
  if (event === 'down') {
    bbox = getBoundingBox(pixelMap, GRID_WIDTH, GRID_HEIGHT);
    if (!bbox) return; // Empty canvas
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bbox.w;
    tempCanvas.height = bbox.h;
    const tempCtx = tempCanvas.getContext('2d');
    const imgData = tempCtx.createImageData(bbox.w, bbox.h);
    const data32 = new Uint32Array(imgData.data.buffer);
    
    for (let y = 0; y < bbox.h; y++) {
      for (let x = 0; x < bbox.w; x++) {
        const srcIdx = (bbox.y + y) * GRID_WIDTH + (bbox.x + x);
        data32[y * bbox.w + x] = pixelMap[srcIdx];
      }
    }
    tempCtx.putImageData(imgData, 0, 0);
    
    originalPixelMap = new Uint32Array(pixelMap);
    
    // Clear pixels from original pixelMap
    for (let y = 0; y < bbox.h; y++) {
      for (let x = 0; x < bbox.w; x++) {
        const srcIdx = (bbox.y + y) * GRID_WIDTH + (bbox.x + x);
        pixelMap[srcIdx] = 0;
      }
    }
    renderPixels(); 
    
    dragCanvas = document.createElement('canvas');
    dragCanvas.width = bbox.w;
    dragCanvas.height = bbox.h;
    dragCanvas.className = 'hand-drag-overlay';
    dragCanvas.style.position = 'absolute';
    dragCanvas.style.left = '0';
    dragCanvas.style.top = '0';
    dragCanvas.style.pointerEvents = 'none';
    dragCanvas.style.imageRendering = 'pixelated';
    dragCanvas.style.zIndex = '100';
    
    document.querySelector('.canvas-wrap').appendChild(dragCanvas);
    
    const dragCtx = dragCanvas.getContext('2d');
    dragCtx.drawImage(tempCanvas, 0, 0);
    
    startCell = { ...cell };
    isDragging = true;
    updateDragCanvas(0, 0);
  }
  else if (event === 'move' && isDragging) {
    const dx = cell.x - startCell.x;
    const dy = cell.y - startCell.y;
    
    let clampedDx = dx;
    let clampedDy = dy;
    
    if (bbox.x + clampedDx < 0) clampedDx = -bbox.x;
    if (bbox.y + clampedDy < 0) clampedDy = -bbox.y;
    if (bbox.x + bbox.w + clampedDx > GRID_WIDTH) clampedDx = GRID_WIDTH - bbox.w - bbox.x;
    if (bbox.y + bbox.h + clampedDy > GRID_HEIGHT) clampedDy = GRID_HEIGHT - bbox.h - bbox.y;
    
    updateDragCanvas(clampedDx, clampedDy);
  }
  else if (event === 'up' && isDragging) {
    isDragging = false;
    
    const dx = cell.x - startCell.x;
    const dy = cell.y - startCell.y;
    
    let clampedDx = dx;
    let clampedDy = dy;
    
    if (bbox.x + clampedDx < 0) clampedDx = -bbox.x;
    if (bbox.y + clampedDy < 0) clampedDy = -bbox.y;
    if (bbox.x + bbox.w + clampedDx > GRID_WIDTH) clampedDx = GRID_WIDTH - bbox.w - bbox.x;
    if (bbox.y + bbox.h + clampedDy > GRID_HEIGHT) clampedDy = GRID_HEIGHT - bbox.h - bbox.y;
    
    const finalX = bbox.x + clampedDx;
    const finalY = bbox.y + clampedDy;
    
    const dragCtx = dragCanvas.getContext('2d');
    const imgData = dragCtx.getImageData(0, 0, bbox.w, bbox.h);
    const data32 = new Uint32Array(imgData.data.buffer);
    
    beginStroke();
    
    pixelMap.set(originalPixelMap);
    
    for (let y = 0; y < bbox.h; y++) {
      for (let x = 0; x < bbox.w; x++) {
        const p = data32[y * bbox.w + x];
        if (p !== 0) { 
           const srcIdx = (bbox.y + y) * GRID_WIDTH + (bbox.x + x);
           recordChange(srcIdx, originalPixelMap[srcIdx], 0);
           pixelMap[srcIdx] = 0;
        }
      }
    }
    
    for (let y = 0; y < bbox.h; y++) {
      for (let x = 0; x < bbox.w; x++) {
        const p = data32[y * bbox.w + x];
        if (p !== 0) { 
          const dstIdx = (finalY + y) * GRID_WIDTH + (finalX + x);
          recordChange(dstIdx, pixelMap[dstIdx], p);
          pixelMap[dstIdx] = p;
        }
      }
    }
    
    commitStroke(pixelMap);
    
    dragCanvas.remove();
    dragCanvas = null;
    originalPixelMap = null;
    bbox = null;
    
    renderPixels();
  }
}

function updateDragCanvas(dx, dy) {
  if (!dragCanvas || !bbox) return;
  const zoom = getZoom();
  const pan = getPan();
  
  const logicalX = bbox.x + dx;
  const logicalY = bbox.y + dy;
  
  const screenX = pan.x + logicalX * zoom;
  const screenY = pan.y + logicalY * zoom;
  
  dragCanvas.style.transform = `translate(${screenX}px, ${screenY}px)`;
  dragCanvas.style.width = `${bbox.w * zoom}px`;
  dragCanvas.style.height = `${bbox.h * zoom}px`;
}

function getBoundingBox(pixels, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = pixels[y * w + x];
      if (((p >> 24) & 0xff) !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX === -1) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
