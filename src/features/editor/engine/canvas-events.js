import { els, currentTool, GRID_WIDTH, GRID_HEIGHT, pixelMap, setPreviewPixels, setStatus } from './core/state.js';
import { getCellPx, getCellPxClamped, applyTransform, getZoom, getPan, setPan, setZoom, getMinZoom, getMaxZoom } from './core/viewport.js';
import { isTaskRunning, abortCurrentTask } from './core/task-manager.js';
import { t } from '../../../i18n/i18n.js';
import { renderPixels } from './core/render.js';
import { parseUint32ToHex } from './core/color-utils.js';
import { beginStroke, commitStroke } from './core/history.js';
import { debouncedSaveWorkspace } from './core/tab-manager.js';
import { writePixel } from './core/pixel-writer.js';

import { usePixelPen } from './tools/pen/pixel-pen.js';
import { useHighlightPen } from './tools/pen/highlight-pen.js';
import { useBlendBrush } from './tools/pen/blend-brush.js';
import { useSprayPen } from './tools/pen/spray-pen.js';
import { useDitherBrush } from './tools/pen/dither-brush.js';
import { useSoftBrush } from './tools/pen/soft-brush.js';
import { useEraser } from './tools/eraser.js';
import { usePicker } from './tools/picker.js';
import { useFill } from './tools/fill.js';
import { useMagicEraser } from './tools/magic-eraser.js';
import { useOutline } from './tools/outline.js';
import { useLineTool } from './tools/line.js';
import { useRectTool } from './tools/rect.js';
import { useCircleTool } from './tools/circle.js';
import { useHandTool } from './tools/hand.js';
import { useReplaceColor } from './tools/replace-color.js';
import { useSelectTool } from './tools/select.js';
import { useTextTool } from './tools/text.js';
let isDrawing = false;
let lastCell = null;
let panStart = null;
let rulerAnchor = null;
let rulerDir = null;
let measureStartCell = null;
let measureHideTimer = null;

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

  const resizePopover = document.getElementById('resizePopover');
  if (resizePopover && resizePopover.style.display === 'block') {
    cursor.style.display = 'none';
    return;
  }

  const globalSettingsModal = document.getElementById('globalSettingsModal');
  if (globalSettingsModal && globalSettingsModal.style.display === 'flex') {
    cursor.style.display = 'none';
    return;
  }

  const canvasElement = document.getElementById('pixelCanvas');

  if (!cell || ['pan', 'hand', 'picker', 'fill', 'outline', 'magic-eraser', 'replace-color'].includes(currentTool)) {
    cursor.style.display = 'none';
    if (canvasElement) {
      if (currentTool === 'hand' || panStart) {
        canvasElement.style.cursor = panStart ? 'grabbing' : 'grab';
      } else {
        canvasElement.style.cursor = '';
      }
    }
    return;
  }

  if (canvasElement) {
    canvasElement.style.cursor = '';
  }

  let size = 1;
  let color1 = getColor(e.buttons & 2 ? 2 : 0);
  let borderColor = color1;

  if (currentTool === 'eraser') {
    size = parseInt(document.getElementById('eraserSize')?.value || '1', 10);
    color1 = '#ff0000';
    borderColor = '#ff0000';
  } else if (currentTool === 'pixel-pen') {
    size = parseInt(document.getElementById('pixelPenSize')?.value || '1', 10);
  } else if (currentTool === 'highlight-pen') {
    size = parseInt(document.getElementById('highlightPenSize')?.value || '1', 10);
  } else if (currentTool === 'blend-brush') {
    size = parseInt(document.getElementById('blendBrushSize')?.value || '1', 10);
  } else if (currentTool === 'dither-brush') {
    size = parseInt(document.getElementById('ditherBrushSize')?.value || '1', 10);
  } else if (currentTool === 'soft-brush') {
    size = parseInt(document.getElementById('softBrushSize')?.value || '3', 10);
  } else if (currentTool === 'spray-pen') {
    size = parseInt(document.getElementById('sprayPenSize')?.value || '10', 10);
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

  const penTools = ['pixel-pen', 'highlight-pen', 'blend-brush', 'spray-pen', 'dither-brush', 'soft-brush', 'eraser'];
  if (penTools.includes(currentTool)) {
    const shape = document.getElementById('globalPenShape')?.value || 'circle';

    // For regular pens, size 1 and 2 are always drawn as squares to avoid missing pixels.
    // Spray pen can always be a circle visually.
    if (shape === 'circle' && (currentTool === 'spray-pen' || size > 2)) {
      cursor.style.borderRadius = '50%';
    } else {
      cursor.style.borderRadius = '0';
    }
  } else {
    cursor.style.borderRadius = '0';
  }

  if (currentTool === 'spray-pen') {
    cursor.style.background = 'transparent';
  }

  // Ruler Mode Logic
  const rulerMode = document.getElementById('rulerMode')?.checked;
  const rulerOption = document.getElementById('rulerOptionSelect')?.value || 'draw';

  if (rulerMode && rulerOption === 'draw') {
    if (isDrawing && rulerAnchor && cell) {
      drawRulerOverlay(rulerAnchor, cell);
    } else {
      hideRulerOverlay();
    }
  } else if (!rulerMode) {
    hideRulerOverlay();
  }
}

function hideRulerOverlay() {
  const overlay = document.getElementById('ruler-overlay');
  if (overlay) overlay.style.display = 'none';
}

function drawRulerOverlay(startCell, endCell) {
  const overlay = document.getElementById('ruler-overlay');
  if (!overlay) return;

  const zoom = getZoom();
  const pan = getPan();
  const toScreen = (cx, cy) => ({
    x: pan.x + (cx + 0.5) * zoom,
    y: pan.y + (cy + 0.5) * zoom,
  });

  const p1 = toScreen(startCell.x, startCell.y);
  const p2 = toScreen(endCell.x, endCell.y);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) {
    overlay.style.display = 'none';
    return;
  }

  // Unit vector along the line, and its perpendicular, for tick marks
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;
  const tickLen = 6;

  const line = document.getElementById('rulerLine');
  const tickStart = document.getElementById('rulerTickStart');
  const tickEnd = document.getElementById('rulerTickEnd');
  const label = document.getElementById('rulerLabel');

  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', p2.x);
  line.setAttribute('y2', p2.y);

  tickStart.setAttribute('x1', p1.x - px * tickLen);
  tickStart.setAttribute('y1', p1.y - py * tickLen);
  tickStart.setAttribute('x2', p1.x + px * tickLen);
  tickStart.setAttribute('y2', p1.y + py * tickLen);

  tickEnd.setAttribute('x1', p2.x - px * tickLen);
  tickEnd.setAttribute('y1', p2.y - py * tickLen);
  tickEnd.setAttribute('x2', p2.x + px * tickLen);
  tickEnd.setAttribute('y2', p2.y + py * tickLen);

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const labelOffset = 12;
  label.setAttribute('x', midX + px * labelOffset);
  label.setAttribute('y', midY + py * labelOffset);

  const pixelDist = Math.round(dist / zoom) + 1;
  label.textContent = `${pixelDist}px`;

  overlay.style.display = 'block';
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
let lastMoveEvent = null;

function onPointerDown(e) {
  if (e.target.closest('.text-tool-overlay-ui')) return;

  if (isTaskRunning()) {
    abortCurrentTask();
    setStatus(t('status.taskAborted'));
  }

  const cell = getCellPx(e.clientX, e.clientY);

  if (e.button === 2) {
    e.preventDefault();
    if (cell) {
      const idx = cell.y * GRID_WIDTH + cell.x;
      const picked = pixelMap[idx];
      if (picked && els.colorPicker) {
        const hex = parseUint32ToHex(picked);
        els.colorPicker.value = hex;
        els.colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
        setStatus(`${t('status.pickedColor')} ${hex}`);
      }
    }
    updateBrushCursor(e, cell);
    return;
  }

  // Use middle click (button === 1) or 'pan' tool for panning
  if (e.button === 1 || currentTool === 'pan') {
    e.preventDefault(); // Prevent auto-scroll on middle click
    panStart = { x: e.clientX, y: e.clientY, px: getPan().x, py: getPan().y };
    updateBrushCursor(e, null);
    return;
  }

  // Verify that the current tool is actually selected and visible in the UI
  const activeBtn = document.querySelector(`.tool-btn[data-tool="${currentTool}"]`);
  if (!activeBtn || !activeBtn.classList.contains('active')) {
    setStatus(t('status.toolHidden') || 'Vui lòng chọn một công cụ để sử dụng.');
    return;
  }

  if (!cell) {
    if (e.target.closest('.canvas-wrap') && !e.target.closest('.toolbar-container')) {
      spawnParticle(e.clientX, e.clientY, getColor(e.button));
    }
    updateBrushCursor(e, null);
    if (measureHideTimer) {
      clearTimeout(measureHideTimer);
      hideRulerOverlay();
      measureStartCell = null;
    }
    return;
  }

  const rulerMode = document.getElementById('rulerMode')?.checked;
  const rulerOption = document.getElementById('rulerOptionSelect')?.value || 'draw';
  const isMeasureOnly = rulerMode && rulerOption === 'measure';

  if (isMeasureOnly) {
    if (measureHideTimer) {
      clearTimeout(measureHideTimer);
      measureHideTimer = null;
    }
    if (measureStartCell) {
      drawRulerOverlay(measureStartCell, cell);
      measureStartCell = null;
      measureHideTimer = setTimeout(() => hideRulerOverlay(), 3000);
    } else {
      measureStartCell = { ...cell };
      drawRulerOverlay(measureStartCell, cell);
    }
    return;
  }

  isDrawing = true;
  lastCell = cell;
  rulerAnchor = { ...cell };
  rulerDir = null;

  const isAsyncTool = ['fill', 'magic-eraser', 'outline', 'replace-color'].includes(currentTool);
  if (!isAsyncTool) {
    beginStroke();
  }

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
    updateBrushCursor(e, null); // Cập nhật cursor (grabbing)
    return;
  }

  let cell = getCellPx(e.clientX, e.clientY);

  if (!cell) {
    if (e.target.closest('.canvas-wrap') && !e.target.closest('.toolbar-container')) {
      const now = Date.now();
      if (now - lastParticleTime > 40) {
        spawnParticle(e.clientX, e.clientY, getColor(e.buttons === 2 ? 2 : 0));
        lastParticleTime = now;
      }
    }

    if (isDrawing) {
      cell = getCellPxClamped(e.clientX, e.clientY);
    } else {
      updateBrushCursor(e, null);
      return;
    }
  }

  if (isDrawing && lastCell && (cell.x !== lastCell.x || cell.y !== lastCell.y)) {
    const stepDir = { x: Math.sign(cell.x - lastCell.x), y: Math.sign(cell.y - lastCell.y) };
    if (rulerDir && (stepDir.x !== rulerDir.x || stepDir.y !== rulerDir.y)) {
      rulerAnchor = { ...lastCell };
    }
    rulerDir = stepDir;
  }

  const rulerMode = document.getElementById('rulerMode')?.checked;
  const rulerOption = document.getElementById('rulerOptionSelect')?.value || 'draw';
  const isMeasureOnly = rulerMode && rulerOption === 'measure';

  if (isMeasureOnly) {
    if (measureStartCell && cell) {
      drawRulerOverlay(measureStartCell, cell);
    }
    updateBrushCursor(e, cell);
    return;
  }

  updateBrushCursor(e, cell);

  if (!isDrawing) return;
  if (cell.x === lastCell?.x && cell.y === lastCell?.y) return;

  const color = getColor(e.buttons & 2 ? 2 : 0);
  const isPreviewTool = currentTool === 'rect' || currentTool === 'circle' || currentTool === 'line';

  dispatchTool(currentTool, 'move', cell, color, e, lastCell);
  lastCell = cell;
  renderPixels(isPreviewTool);
}

function onPointerUp(e) {
  if (panStart) {
    panStart = null;
    const cell = getCellPx(e.clientX, e.clientY);
    updateBrushCursor(e, cell);
    return;
  }

  const rulerMode = document.getElementById('rulerMode')?.checked;
  const rulerOption = document.getElementById('rulerOptionSelect')?.value || 'draw';
  const isMeasureOnly = rulerMode && rulerOption === 'measure';

  if (isMeasureOnly) {
    if (measureStartCell) {
      const cell = getCellPx(e.clientX, e.clientY) || getCellPxClamped(e.clientX, e.clientY);
      if (cell && (cell.x !== measureStartCell.x || cell.y !== measureStartCell.y)) {
        // User dragged and released on a different cell, lock measurement
        drawRulerOverlay(measureStartCell, cell);
        measureStartCell = null;
        if (measureHideTimer) clearTimeout(measureHideTimer);
        measureHideTimer = setTimeout(() => hideRulerOverlay(), 3000);
      }
    }
    return;
  }

  if (!isDrawing) return;

  isDrawing = false;

  const cell = getCellPx(e.clientX, e.clientY) || getCellPxClamped(e.clientX, e.clientY);
  const color = getColor(e.button);
  dispatchTool(currentTool, 'up', cell, color, e, lastCell);


  const isAsyncTool = ['fill', 'magic-eraser', 'outline'].includes(currentTool);
  if (!isAsyncTool) {
    commitStroke(pixelMap);
  }

  setPreviewPixels(null);
  renderPixels();
  lastCell = null;
  rulerAnchor = null;
  rulerDir = null;
  hideRulerOverlay();
  debouncedSaveWorkspace();
}

function onWheel(e) {
  e.preventDefault();
  const canvas = document.getElementById('pixelCanvas');
  const zoom = getZoom();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.min(getMaxZoom(), Math.max(getMinZoom(), zoom * delta));

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
  setZoom(newZoom);
  applyTransform(canvas);
  updateBrushCursor(e, null);
}

function dispatchTool(tool, event, cell, color, e, prevCell) {
  switch (tool) {
    case 'pixel-pen': usePixelPen(event, cell, color, prevCell); break;
    case 'highlight-pen': useHighlightPen(event, cell, color, prevCell); break;
    case 'blend-brush': useBlendBrush(event, cell, color, prevCell); break;
    case 'dither-brush': useDitherBrush(event, cell, color, prevCell); break;
    case 'soft-brush': useSoftBrush(event, cell, color, prevCell); break;
    case 'spray-pen': useSprayPen(event, cell, color); break;
    case 'eraser': useEraser(event, cell, prevCell); break;
    case 'picker': if (event === 'down') usePicker(cell); break;
    case 'fill': if (event === 'down') useFill(cell, color); break;
    case 'replace-color': if (event === 'down') useReplaceColor(cell, color); break;
    case 'magic-eraser': if (event === 'down') useMagicEraser(cell); break;
    case 'outline': if (event === 'down') useOutline(color, cell); break;
    case 'line': useLineTool(event, cell, color, prevCell); break;
    case 'rect': useRectTool(event, cell, color, prevCell); break;
    case 'circle': useCircleTool(event, cell, color, prevCell); break;
    case 'hand': useHandTool(event, cell, e); break;
    case 'select': useSelectTool(event, cell, color, prevCell); break;
    case 'text': useTextTool(event, cell, color, prevCell); break;
  }
}

export function setupCanvasEvents() {
  const canvas = document.getElementById('pixelCanvas');
  if (!canvas) return;

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  const wrap = document.querySelector('.canvas-wrap');
  if (wrap) {
    wrap.addEventListener('pointerdown', onPointerDown);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('contextmenu', e => e.preventDefault());
  }

  document.body.addEventListener('change', (e) => {
    if (e.target.id === 'rulerMode') {
      document.getElementById('rulerModeLabel')?.classList.toggle('active', e.target.checked);
    }
  });
}