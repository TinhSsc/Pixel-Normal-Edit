import { els, currentTool, GRID_WIDTH, GRID_HEIGHT, pixelMap, setPreviewPixels, setStatus } from './core/state.js';
import { getCellPx, applyTransform, getZoom, getPan, setPan } from './core/viewport.js';
import { isTaskRunning, abortCurrentTask } from './core/task-manager.js';
import { t } from './lang/i18n.js';
import { renderPixels } from './core/render.js';
import { beginStroke, commitStroke } from './core/history.js';
import { writePixel } from './shared/pixel-writer.js';

import { usePencil } from './tools/pencil.js';
import { useEraser } from './tools/eraser.js';
import { usePicker } from './tools/picker.js';
import { useFill } from './tools/fill.js';
import { useMagicEraser } from './tools/magic-eraser.js';
import { useOutline } from './tools/outline.js';
import { useLineTool } from './tools/line.js';
import { useRectTool } from './tools/rect.js';
import { useCircleTool } from './tools/circle.js';

let isDrawing = false;
let lastCell = null;
let panStart = null;

function getColor(btn) {
  if (btn === 2) return els.colorPicker2?.value || '#ffffff';
  return els.colorPicker?.value || '#000000';
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;
  if (hex.startsWith('rgba')) return hex;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateBrushCursor(e, cell) {
  const cursor = document.getElementById('brush-cursor');
  if (!cursor) return;

  if (!cell || ['pan', 'picker', 'fill', 'outline', 'magic-eraser'].includes(currentTool)) {
    cursor.style.display = 'none';
    return;
  }

  let size = 1;
  let color1 = getColor(e.buttons & 2 ? 2 : 0);
  let borderColor = color1;

  if (currentTool === 'eraser') {
    size = parseInt(document.getElementById('eraserSize')?.value || '1', 10);
    color1 = '#ff0000';
    borderColor = '#ff0000';
  } else if (currentTool === 'pencil') {
    size = parseInt(document.getElementById('pencilSize')?.value || '1', 10);
  } else if (['line', 'rect', 'circle'].includes(currentTool)) {
    const shapeInputs = document.querySelectorAll('.shape-thickness');
    for (const input of shapeInputs) {
      if (input.offsetParent !== null || input.value) {
        size = parseInt(input.value || '1', 10);
        break;
      }
    }
  }

  const offset = Math.floor(size / 2);
  const startX = cell.x - offset;
  const startY = cell.y - offset;

  const zoom = getZoom();
  const pan = getPan();
  const screenX = pan.x + startX * zoom;
  const screenY = pan.y + startY * zoom;

  cursor.style.display = 'block';
  cursor.style.position = 'absolute';
  cursor.style.left = `${screenX}px`;
  cursor.style.top = `${screenY}px`;
  cursor.style.width = `${size * zoom}px`;
  cursor.style.height = `${size * zoom}px`;
  
  const gradientMode = document.getElementById('gradientMode')?.checked;
  if (gradientMode && currentTool !== 'eraser') {
    const color2 = getColor(e.buttons & 2 ? 0 : 2);
    cursor.style.background = `linear-gradient(135deg, ${hexToRgba(color1, 0.6)}, ${hexToRgba(color2, 0.6)})`;
  } else {
    cursor.style.background = hexToRgba(color1, 0.4);
  }
  
  cursor.style.border = `1px solid ${borderColor}`;
  cursor.style.pointerEvents = 'none';
  cursor.style.zIndex = '999';
  cursor.style.boxSizing = 'border-box';
}

function spawnParticle(x, y, color) {
  const p = document.createElement('div');
  p.className = 'pixel-particle';
  p.style.left = (x - 4) + 'px';
  p.style.top = (y - 4) + 'px';
  p.style.width = '8px';
  p.style.height = '8px';
  p.style.backgroundColor = color || '#5b5bf0';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 800);
}

let lastParticleTime = 0;

function onPointerDown(e) {
  if (isTaskRunning()) {
    abortCurrentTask();
    setStatus(t('status.taskAborted'));
  }

  const cell = getCellPx(e.clientX, e.clientY);

  if (e.button === 2) {
    e.preventDefault();
    if (cell) {
      const key = (cell.x << 16) | cell.y;
      const picked = pixelMap.get(key);
      if (picked && els.colorPicker) {
        els.colorPicker.value = picked;
      }
    }
    updateBrushCursor(e, cell);
    return;
  }

  // Use middle click (button === 1) or 'pan' tool for panning
  if (e.button === 1 || currentTool === 'pan') {
    e.preventDefault(); // Prevent auto-scroll on middle click
    panStart = { x: e.clientX, y: e.clientY, px: getPan().x, py: getPan().y };
    return;
  }

  if (!cell) {
    if (e.target.closest('#pixelCanvas') || e.target.closest('.canvas-wrap')) {
      spawnParticle(e.clientX, e.clientY, getColor(e.button));
    }
    updateBrushCursor(e, null);
    return;
  }
  isDrawing = true;
  lastCell = cell;
  beginStroke();

  const color = getColor(e.button);
  dispatchTool(currentTool, 'down', cell, color, e);
  renderPixels();
  updateBrushCursor(e, cell);
}

function onPointerMove(e) {
  if (panStart) {
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPan(panStart.px + dx, panStart.py + dy);
    applyTransform(document.getElementById('pixelCanvas'));
    return;
  }

  const cell = getCellPx(e.clientX, e.clientY);
  
  if (!cell) {
    if (e.target.closest('.canvas-wrap')) {
      const now = Date.now();
      if (now - lastParticleTime > 40) {
        spawnParticle(e.clientX, e.clientY, getColor(e.buttons === 2 ? 2 : 0));
        lastParticleTime = now;
      }
    }
    if (isDrawing) lastCell = null;
    updateBrushCursor(e, null);
    return;
  }

  updateBrushCursor(e, cell);

  if (!isDrawing) return;
  if (cell.x === lastCell?.x && cell.y === lastCell?.y) return;

  const color = getColor(e.buttons & 2 ? 2 : 0);
  dispatchTool(currentTool, 'move', cell, color, e, lastCell);
  lastCell = cell;
  renderPixels();
}

function onPointerUp(e) {
  if (panStart) { panStart = null; return; }
  if (!isDrawing) return;
  isDrawing = false;

  const cell = getCellPx(e.clientX, e.clientY);
  const color = getColor(e.button);
  dispatchTool(currentTool, 'up', cell, color, e);

  setPreviewPixels(null);
  commitStroke(pixelMap);
  renderPixels();
  lastCell = null;
}

function onWheel(e) {
  e.preventDefault();
  const canvas = document.getElementById('pixelCanvas');
  const zoom = getZoom();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.min(64, Math.max(0.1, zoom * delta));

  const rect = canvas.getBoundingClientRect();
  const pan = getPan();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const newPanX = e.clientX - mouseX * (newZoom / zoom) - (pan.x - mouseX) * (newZoom / zoom);
  const newPanY = e.clientY - mouseY * (newZoom / zoom) - (pan.y - mouseY) * (newZoom / zoom);

  // simpler: scale around mouse
  const originX = pan.x + mouseX;
  const originY = pan.y + mouseY;
  setPan(
    originX - mouseX * (newZoom / zoom),
    originY - mouseY * (newZoom / zoom)
  );

  // inline zoom update
  import('./core/viewport.js').then(({ setZoom, applyTransform }) => {
    setZoom(newZoom);
    applyTransform(canvas);
  });
}

function dispatchTool(tool, event, cell, color, e, prevCell) {
  switch (tool) {
    case 'pencil':      usePencil(event, cell, color, prevCell); break;
    case 'eraser':      useEraser(event, cell, prevCell); break;
    case 'picker':      if (event === 'down') usePicker(cell); break;
    case 'fill':        if (event === 'down') useFill(cell, color); break;
    case 'magic-eraser':if (event === 'down') useMagicEraser(cell); break;
    case 'outline':     if (event === 'down') useOutline(color, cell); break;
    case 'line':        useLineTool(event, cell, color, prevCell); break;
    case 'rect':        useRectTool(event, cell, color, prevCell); break;
    case 'circle':      useCircleTool(event, cell, color, prevCell); break;
  }
}

export function setupCanvasEvents() {
  const canvas = document.getElementById('pixelCanvas');
  if (!canvas) return;

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}
