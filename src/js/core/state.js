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
  els.zoomInBtn          = document.getElementById("zoomInBtn");
  els.zoomOutBtn         = document.getElementById("zoomOutBtn");
  els.zoomResetBtn       = document.getElementById("zoomResetBtn");
  els.stopTaskBtn        = document.getElementById("stopTaskBtn");

  if (els.stopTaskBtn) {
    els.stopTaskBtn.addEventListener('click', () => {
      import('./task-manager.js').then(({ abortCurrentTask }) => abortCurrentTask());
    });
  }
  
  canvas = document.getElementById("pixelCanvas");
  ctx = canvas ? canvas.getContext("2d") : null;
}

export function setStatus(msg, isError = false) {
  if (!els.status) return;
  els.status.textContent = msg;
  els.status.style.color = isError ? "#d33" : "#aaa";
}

export function setTaskUI(isRunning) {
  if (els.stopTaskBtn) {
    els.stopTaskBtn.style.display = isRunning ? 'block' : 'none';
  }
}

export let GRID_WIDTH = 32;
export let GRID_HEIGHT = 32;

export const offscreenCanvas = document.createElement('canvas');
export const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
export let offscreenImageData = null;
export let offscreenData32 = null;

export let pixelMap = new Map();
export let groupMap = new Map();
export let previewPixels = null;

export let currentTool = "pencil";

export function setGridSizeParams(w, h, imageData, data32) {
  GRID_WIDTH = w;
  GRID_HEIGHT = h;
  offscreenImageData = imageData;
  offscreenData32 = data32;
}

export function resetMaps(newPixelMap = new Map(), newGroupMap = new Map()) {
  pixelMap = newPixelMap;
  groupMap = newGroupMap;
}

export function setPreviewPixels(pixels) {
  previewPixels = pixels;
}

export function setCurrentTool(tool) {
  currentTool = tool;
}
