import { ctx, GRID_WIDTH, GRID_HEIGHT, pixelMap, previewPixels, offscreenData32 } from './state.js';

let zoom = 1;
let panX = 0;
let panY = 0;

export function getZoom() { return zoom; }
export function getPan() { return { x: panX, y: panY }; }

export function setZoom(z) { zoom = z; }
export function setPan(x, y) { panX = Math.round(x); panY = Math.round(y); }

export function resizeCanvas() {
  const canvas = document.getElementById("pixelCanvas");
  if (!canvas) return;
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
}

export function fitToScreen() {
  const canvas = document.getElementById("pixelCanvas");
  const wrap = canvas?.parentElement;
  if (!canvas || !wrap) return;

  const ww = wrap.clientWidth;
  const wh = wrap.clientHeight;

  const scaleX = ww / GRID_WIDTH;
  const scaleY = wh / GRID_HEIGHT;
  zoom = Math.min(scaleX, scaleY) * 0.95;

  panX = Math.round((ww - GRID_WIDTH * zoom) / 2);
  panY = Math.round((wh - GRID_HEIGHT * zoom) / 2);

  applyTransform(canvas);
}

export function zoomIn() {
  const canvas = document.getElementById("pixelCanvas");
  const wrap = canvas?.parentElement;
  if (!canvas || !wrap) return;
  const oldZoom = zoom;
  zoom = Math.min(zoom * 1.25, 64);
  
  const cx = wrap.clientWidth / 2;
  const cy = wrap.clientHeight / 2;
  panX = Math.round(cx - (cx - panX) * (zoom / oldZoom));
  panY = Math.round(cy - (cy - panY) * (zoom / oldZoom));
  
  applyTransform(canvas);
}

export function zoomOut() {
  const canvas = document.getElementById("pixelCanvas");
  const wrap = canvas?.parentElement;
  if (!canvas || !wrap) return;
  const oldZoom = zoom;
  zoom = Math.max(zoom / 1.25, 0.1);
  
  const cx = wrap.clientWidth / 2;
  const cy = wrap.clientHeight / 2;
  panX = Math.round(cx - (cx - panX) * (zoom / oldZoom));
  panY = Math.round(cy - (cy - panY) * (zoom / oldZoom));
  
  applyTransform(canvas);
}

export function applyTransform(canvas) {
  if (!canvas) return;
  canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  
  const gridOverlay = document.getElementById('gridOverlay');
  if (gridOverlay) {
    gridOverlay.style.transform = `translate(${panX}px, ${panY}px)`;
    gridOverlay.style.width = `${GRID_WIDTH * zoom}px`;
    gridOverlay.style.height = `${GRID_HEIGHT * zoom}px`;
    gridOverlay.style.border = `1px solid #3e3e4a`;
    gridOverlay.style.boxSizing = 'content-box';
    gridOverlay.style.top = `-1px`;
    gridOverlay.style.left = `-1px`;
    gridOverlay.style.backgroundImage = 'none';
    
    const mirrorLine = document.getElementById('mirrorLine');
    if (mirrorLine) {
      mirrorLine.style.width = `2px`;
      mirrorLine.style.transform = `translateX(-1px)`;
    }
  }

  const gridCanvas = document.getElementById('gridCanvas');
  const wrap = gridCanvas?.parentElement;
  if (gridCanvas && wrap) {
    const ww = wrap.clientWidth;
    const wh = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const physW = Math.round(ww * dpr);
    const physH = Math.round(wh * dpr);

    if (gridCanvas.width !== physW || gridCanvas.height !== physH) {
      gridCanvas.width = physW;
      gridCanvas.height = physH;
      gridCanvas.style.width = `${ww}px`;
      gridCanvas.style.height = `${wh}px`;
    }
    const gctx = gridCanvas.getContext('2d');
    gctx.clearRect(0, 0, physW, physH);

    const showGridFlag = document.getElementById('showGrid')?.checked;
    
    if (zoom > 4 && showGridFlag) {
      gctx.beginPath();
      gctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      gctx.lineWidth = 1;

      const startX = Math.max(0, Math.floor(-panX / zoom));
      const endX = Math.min(GRID_WIDTH, Math.ceil((ww - panX) / zoom));
      
      const startY = Math.max(0, Math.floor(-panY / zoom));
      const endY = Math.min(GRID_HEIGHT, Math.ceil((wh - panY) / zoom));
      
      for (let x = startX; x <= endX; x++) {
        const vx = Math.round((panX + x * zoom) * dpr) + 0.5;
        gctx.moveTo(vx, Math.round((panY + startY * zoom) * dpr));
        gctx.lineTo(vx, Math.round((panY + endY * zoom) * dpr));
      }
      
      for (let y = startY; y <= endY; y++) {
        const vy = Math.round((panY + y * zoom) * dpr) + 0.5;
        gctx.moveTo(Math.round((panX + startX * zoom) * dpr), vy);
        gctx.lineTo(Math.round((panX + endX * zoom) * dpr), vy);
      }
      
      gctx.stroke();
    }
  }
}

export function getCellPx(clientX, clientY) {
  const canvas = document.getElementById("pixelCanvas");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const cellW = rect.width / GRID_WIDTH;
  const cellH = rect.height / GRID_HEIGHT;
  const x = Math.floor((clientX - rect.left) / cellW);
  const y = Math.floor((clientY - rect.top) / cellH);
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return null;
  return { x, y };
}
