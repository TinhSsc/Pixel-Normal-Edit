import { t } from '../../../../i18n/i18n.js';
import {
  GRID_WIDTH, GRID_HEIGHT, els, setGridSizeParams, resetMaps, offscreenCtx,
  layers, activeLayerIndex, groupMap, resetLayers
} from '../core/state.js';
import { resizeCanvas, fitToScreen } from '../core/viewport.js';
import { renderPixels, setForceFullRender } from '../core/render.js';
import { pushResizeHistory, setResizeRestoreHandler } from '../core/history.js';
import { setStatus } from '../core/state.js';
import { debouncedSaveWorkspace, saveCurrentTabState } from '../core/tab-manager.js';
import { debounceExtractCanvasColors } from '../core/color-palette.js';
import { isAnimationMode, resizeAnimation, getAnimationState, setAnimationState, loadFrameToCurrentState } from '../core/animation-state.js';

import { pixelMap } from '../core/state.js';

function captureSnapshot() {
  return {
    w: GRID_WIDTH,
    h: GRID_HEIGHT,
    layers: layers.map(l => ({ ...l, pixelMap: new Uint32Array(l.pixelMap) })),
    activeLayerIndex,
    groupMap: groupMap ? new Map(groupMap) : new Map(),
    animation: getAnimationState()
  };
}

function makeImageData(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c.getContext('2d').createImageData(w, h);
}

function restoreSnapshot(snapshot) {
  const imgData = makeImageData(snapshot.w, snapshot.h);
  const data32 = new Uint32Array(imgData.data.buffer);
  setGridSizeParams(snapshot.w, snapshot.h, imgData, data32);

  resetLayers(snapshot.layers, snapshot.activeLayerIndex, new Map(snapshot.groupMap));

  if (snapshot.animation && snapshot.animation.isAnimationMode) {
    setAnimationState(snapshot.animation);
    loadFrameToCurrentState(snapshot.animation.activeFrameIndex || 0);
  } else {
    setAnimationState(snapshot.animation || null);
  }

  setForceFullRender(true);
  resizeCanvas();
  fitToScreen();
  renderPixels();
  syncGridSizeUI(snapshot.w, snapshot.h);
}

export function setGridSize(w, h, mode = 'clear', dx = 0, dy = 0) {
  setResizeRestoreHandler(restoreSnapshot);

  const oldW = GRID_WIDTH;
  const oldH = GRID_HEIGHT;
  const oldData32 = pixelMap; // Reference to old array

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = w;
  offscreenCanvas.height = h;
  const newCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  
  if (mode === 'keep' || mode === 'scale') {
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = oldW;
    tmpCanvas.height = oldH;
    const tmpCtx = tmpCanvas.getContext('2d');
    const oldImgData = new ImageData(oldW, oldH);
    new Uint32Array(oldImgData.data.buffer).set(oldData32);
    tmpCtx.putImageData(oldImgData, 0, 0);
    
    if (mode === 'scale') {
      newCtx.imageSmoothingEnabled = false;
      newCtx.drawImage(tmpCanvas, 0, 0, w, h);
    } else {
      newCtx.drawImage(tmpCanvas, dx, dy);
    }
  }

  const newData = newCtx.getImageData(0, 0, w, h);
  const newData32 = new Uint32Array(newData.data.buffer);

  const oldSnapshot = captureSnapshot();

  setGridSizeParams(w, h, newData, newData32);
  
  if (mode === 'clear') {
    resetMaps();
  } else {
    resetMaps(new Uint32Array(newData32), new Map());
  }
  
  if (isAnimationMode) {
    // If animation is on, scale all frames so they don't break when we switch to them later
    resizeAnimation(w, h, mode, dx, dy);
  }

  setForceFullRender(true);
  resizeCanvas();
  fitToScreen();
  renderPixels();
  
  syncGridSizeUI(w, h);
  
  setStatus(`Grid size set to ${w}x${h}`);
  
  const isNoopResize = w === oldW && h === oldH && mode === 'clear';
  if (!isNoopResize) {
    pushResizeHistory(oldSnapshot, captureSnapshot());
  }
  saveCurrentTabState();
  debouncedSaveWorkspace();
  debounceExtractCanvasColors();
}

export function syncGridSizeUI(w, h) {
  const textMenu = document.getElementById('currentGridSizeText');
  if (textMenu) {
    textMenu.textContent = `${w}x${h}`;
  }
}

export function setupGridSizeSelect() {
  // This is now handled entirely by the CanvasSettingsModal React component.
  // The global 'open-canvas-settings' event triggers the modal.
  setResizeRestoreHandler(restoreSnapshot);
}
