import { ctx, GRID_WIDTH, GRID_HEIGHT, pixelMap, previewPixels, offscreenData32 } from './state.js';
import { updatePreviewTransform, getPreviewItems } from './preview-group-manager.js';

let zoom = 1;
let panX = 0;
let panY = 0;

export function getZoom() { return zoom; }
export function getPan() { return { x: panX, y: panY }; }

export function setZoom(z) { zoom = z; }
export function setPan(x, y) {
  panX = Math.round(x); 
  panY = Math.round(y); 
}

export function getMinZoom() {
  const MIN_SCREEN_SIZE = 32;
  const previewItems = getPreviewItems();
  const totalCount = previewItems.length + 1;
  return Math.max(0.01, MIN_SCREEN_SIZE / Math.max(GRID_WIDTH * totalCount, GRID_HEIGHT));
}

export function getMaxZoom() {
  const MAX_SCREEN_SIZE = 8192;
  return Math.max(64, MAX_SCREEN_SIZE / Math.max(GRID_WIDTH, GRID_HEIGHT));
}

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
  zoom = Math.max(getMinZoom(), Math.min(getMaxZoom(), zoom));

  panX = Math.round((ww - GRID_WIDTH * zoom) / 2);
  panY = Math.round((wh - GRID_HEIGHT * zoom) / 2);

  applyTransform(canvas);
}

export function zoomIn() {
  const canvas = document.getElementById("pixelCanvas");
  const wrap = canvas?.parentElement;
  if (!canvas || !wrap) return;
  const oldZoom = zoom;
  zoom = Math.min(zoom * 1.25, getMaxZoom());

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
  zoom = Math.max(zoom / 1.25, getMinZoom());

  const cx = wrap.clientWidth / 2;
  const cy = wrap.clientHeight / 2;
  panX = Math.round(cx - (cx - panX) * (zoom / oldZoom));
  panY = Math.round(cy - (cy - panY) * (zoom / oldZoom));

  applyTransform(canvas);
}

export function applyTransform(canvas) {
  if (!canvas) return;
  canvas.style.width = `${GRID_WIDTH * zoom}px`;
  canvas.style.height = `${GRID_HEIGHT * zoom}px`;
  canvas.style.transform = `translate(${panX}px, ${panY}px)`;
  canvas.style.setProperty('--canvas-zoom', zoom);

  const onionCanvas = document.getElementById("onionSkinCanvas");
  if (onionCanvas) {
    onionCanvas.style.width = `${GRID_WIDTH * zoom}px`;
    onionCanvas.style.height = `${GRID_HEIGHT * zoom}px`;
    onionCanvas.style.transform = `translate(${panX}px, ${panY}px)`;
  }

  const bgCanvas = document.getElementById("canvasBackground");
  if (bgCanvas) {
    bgCanvas.style.width = `${GRID_WIDTH * zoom}px`;
    bgCanvas.style.height = `${GRID_HEIGHT * zoom}px`;
    bgCanvas.style.transform = `translate(${panX}px, ${panY}px)`;
    bgCanvas.style.setProperty('--canvas-zoom', zoom);
  }

  const gridOverlay = document.getElementById('gridOverlay');
  if (gridOverlay) {
    gridOverlay.style.transform = `translate(${panX}px, ${panY}px)`;
    gridOverlay.style.width = `${GRID_WIDTH * zoom}px`;
    gridOverlay.style.height = `${GRID_HEIGHT * zoom}px`;
    gridOverlay.style.border = `1px solid #3e3e4a`;
    gridOverlay.style.boxSizing = 'content-box';
    gridOverlay.style.top = `-1px`;
    gridOverlay.style.left = `-1px`;

    // Set CSS variables so attached UI can scale with the canvas
    gridOverlay.style.setProperty('--canvas-zoom', zoom);
    gridOverlay.style.setProperty('--canvas-logical-width', `${GRID_WIDTH}px`);

    const showGridFlag = document.getElementById('showGrid')?.checked;
    if (zoom > 4 && showGridFlag) {
      gridOverlay.style.backgroundImage = `
        linear-gradient(to right, var(--color-grid-line) 1px, transparent 1px),
        linear-gradient(to bottom, var(--color-grid-line) 1px, transparent 1px)
      `;
      gridOverlay.style.backgroundSize = `${zoom}px ${zoom}px`;
      gridOverlay.style.backgroundPosition = `0 0`;
    } else {
      gridOverlay.style.backgroundImage = 'none';
    }

    const mirrorLine = document.getElementById('mirrorLine');
    if (mirrorLine) {
      mirrorLine.style.width = `2px`;
      mirrorLine.style.transform = `translateX(-1px)`;
    }
  }
  
  const showGridFlag = document.getElementById('showGrid')?.checked;
  updatePreviewTransform(panX, panY, zoom, GRID_WIDTH, GRID_HEIGHT, showGridFlag);
  
  window.dispatchEvent(new CustomEvent('viewport-changed', { detail: { zoom, panX, panY } }));
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

export function getCellPxClamped(clientX, clientY) {
  const canvas = document.getElementById("pixelCanvas");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const cellW = rect.width / GRID_WIDTH;
  const cellH = rect.height / GRID_HEIGHT;
  const x = Math.floor((clientX - rect.left) / cellW);
  const y = Math.floor((clientY - rect.top) / cellH);
  return {
    x: Math.min(Math.max(x, 0), GRID_WIDTH - 1),
    y: Math.min(Math.max(y, 0), GRID_HEIGHT - 1),
  };
}
