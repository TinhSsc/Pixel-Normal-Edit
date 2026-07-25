import { abortCurrentTask } from './task-manager.js';

export const els = {};
export let canvas = null;
export let ctx = null;

export function initEls() {
  els.openUploadModalBtn = document.getElementById("openUploadModalBtn");
  els.imagePreview       = document.getElementById("imagePreview");
  els.compressBtn        = document.getElementById("compressBtn");
  els.gridSizeSelect     = document.getElementById("gridSizeSelect");
  els.status             = document.getElementById("status");
  els.colorPicker        = document.getElementById("colorPicker");
  els.colorPicker2       = document.getElementById("colorPicker2");
  els.toolBtns           = document.querySelectorAll(".tool-btn[data-tool]");
  els.undoBtns           = document.querySelectorAll(".undo-btn-action");
  els.redoBtns           = document.querySelectorAll(".redo-btn-action");
  els.mirrorMode         = document.getElementById("mirrorMode");
  els.rotateBtn          = document.getElementById("rotateBtn");
  els.flipHBtn           = document.getElementById("flipHBtn");
  els.flipVBtn           = document.getElementById("flipVBtn");
  els.showGrid           = document.getElementById("showGrid");
  els.showGridLabel      = document.getElementById("showGridLabel");
  els.exportFormatBtns   = document.querySelectorAll(".dl-format-btn");
  els.setBgBtn           = document.getElementById("setBgBtn");
  els.replaceBgBtn       = document.getElementById("replaceBgBtn");
  els.flattenBgBtn       = document.getElementById("flattenBgBtn");
  els.zoomInBtn          = document.getElementById("zoomInBtn");
  els.zoomOutBtn         = document.getElementById("zoomOutBtn");
  els.zoomResetBtn       = document.getElementById("zoomResetBtn");
  els.stopTaskBtn        = document.getElementById("stopTaskBtn");

  if (els.stopTaskBtn) {
    els.stopTaskBtn.addEventListener('click', () => {
      abortCurrentTask();
    });
  }
  
  canvas = document.getElementById("pixelCanvas");
  ctx = canvas ? canvas.getContext("2d") : null;
}

let statusTimeout = null;

export function setStatus(msg, isError = false) {
  if (!els.status) return;
  els.status.textContent = msg;
  els.status.style.color = isError ? "#ff4d4f" : "var(--text-primary)";
  
  const container = document.getElementById('toastContainer');
  if (container) container.classList.add('show');
  
  if (statusTimeout) clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    if (els.stopTaskBtn && els.stopTaskBtn.style.display === 'block') return;
    if (container) container.classList.remove('show');
  }, 3000);
}

export function setTaskUI(isRunning) {
  if (els.stopTaskBtn) {
    els.stopTaskBtn.style.display = isRunning ? 'block' : 'none';
  }
  const container = document.getElementById('toastContainer');
  if (container) {
    if (isRunning) container.classList.add('show');
    else if (!statusTimeout) container.classList.remove('show');
  }
}

export let GRID_WIDTH = 32;
export let GRID_HEIGHT = 32;
export let gridGeneration = 0;

export const offscreenCanvas = document.createElement('canvas');
export const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
export let offscreenImageData = null;
export let offscreenData32 = null;

export let layers = [{
  id: 'layer_0',
  name: 'Layer 0',
  visible: true,
  locked: false,
  pixelMap: new Uint32Array(GRID_WIDTH * GRID_HEIGHT)
}];
export let activeLayerIndex = 0;
export let pixelMap = layers[0].pixelMap;
export let groupMap = new Map();
export let previewPixels = null;

export let selectionBox = null;
export let clipboardData = null;
export let floatingSelection = null;

export let currentTool = "pencil";
export let currentVariant = null;

export function setGridSizeParams(w, h, imageData, data32) {
  GRID_WIDTH = w;
  GRID_HEIGHT = h;
  offscreenImageData = imageData;
  offscreenData32 = data32;
  gridGeneration++;
}

export function resetMaps(newPixelMap = null, newGroupMap = new Map()) {
  if (newPixelMap) {
    if (pixelMap.length === newPixelMap.length) {
      pixelMap.set(newPixelMap);
    } else {
      pixelMap = new Uint32Array(newPixelMap);
    }
  } else {
    if (pixelMap.length === GRID_WIDTH * GRID_HEIGHT) {
      pixelMap.fill(0);
    } else {
      pixelMap = new Uint32Array(GRID_WIDTH * GRID_HEIGHT);
    }
  }
  if (layers[activeLayerIndex]) {
    layers[activeLayerIndex].pixelMap = pixelMap;
  }
  groupMap = newGroupMap;
}

export function resetLayers(newLayers, activeIndex, newGroupMap = new Map()) {
  layers = newLayers.map(l => ({...l, pixelMap: new Uint32Array(l.pixelMap)}));
  activeLayerIndex = activeIndex;
  if (!layers[activeLayerIndex]) {
     layers[activeLayerIndex] = {
        id: `layer_${Date.now()}`,
        name: 'Layer 0',
        visible: true,
        locked: false,
        pixelMap: new Uint32Array(GRID_WIDTH * GRID_HEIGHT)
     };
  }
  pixelMap = layers[activeLayerIndex].pixelMap;
  groupMap = newGroupMap;
  window.dispatchEvent(new CustomEvent('layer-changed', { detail: { activeLayerIndex, layers } }));
}

export function setActiveLayerIndex(index) {
  if (index < 0 || index >= layers.length) return;
  activeLayerIndex = index;
  pixelMap = layers[activeLayerIndex].pixelMap;
  window.dispatchEvent(new CustomEvent('layer-changed', { detail: { activeLayerIndex, layers } }));
}

export function updateLayersInfo(newLayers) {
  layers = newLayers;
  if (activeLayerIndex >= layers.length) activeLayerIndex = Math.max(0, layers.length - 1);
  if (layers.length === 0) {
    layers.push({
      id: `layer_${Date.now()}`,
      name: 'Layer 0',
      visible: true,
      locked: false,
      pixelMap: new Uint32Array(GRID_WIDTH * GRID_HEIGHT)
    });
  }
  pixelMap = layers[activeLayerIndex].pixelMap;
  window.dispatchEvent(new CustomEvent('layer-changed', { detail: { activeLayerIndex, layers } }));
}

export function setPreviewPixels(pixels) {
  previewPixels = pixels;
}

export function setSelectionBox(box) {
  selectionBox = box;
}

export function setClipboardData(data) {
  clipboardData = data;
}

export function setFloatingSelection(selection) {
  floatingSelection = selection;
}

export function setCurrentTool(tool, variant = null) {
  currentTool = tool;
  currentVariant = variant;
  window.dispatchEvent(new CustomEvent('tool-changed', { detail: { tool, variant } }));
}

export let textToolState = {
  isActive: false,
  isEditing: false,
  box: null, // {x, y, w, h} in grid coordinates
  text: "",
  font: "Arial",
  size: 16,
  bold: false,
  italic: false,
  color: "#000000"
};

export function setTextToolState(newState) {
  textToolState = { ...textToolState, ...newState };
  window.dispatchEvent(new CustomEvent('text-tool-updated', { detail: textToolState }));
}
