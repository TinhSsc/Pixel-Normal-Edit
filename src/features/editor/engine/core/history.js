let undoStack = [];
let redoStack = [];
let currentStroke = null;

import { debounceExtractCanvasColors } from './color-palette.js';
import { activeLayerIndex, layers, resetLayers } from './state.js';

export function resetHistory() {
  undoStack = [];
  redoStack = [];
  currentStroke = null;
}

export function getHistoryState() {
  return { undoStack, redoStack, currentStroke };
}

export function setHistoryState(state) {
  undoStack = state.undoStack || [];
  redoStack = state.redoStack || [];
  currentStroke = state.currentStroke || null;
}

export function beginStroke() {
  currentStroke = { keys: [], oldColors: [], newColors: [], layerIndex: activeLayerIndex };
}

export function recordChange(idx, oldColor, newColor) {
  if (!currentStroke) return;
  
  currentStroke.keys.push(idx);
  currentStroke.oldColors.push(oldColor);
  currentStroke.newColors.push(newColor);
}

export function commitStroke(pixelMap) {
  if (!currentStroke || currentStroke.keys.length === 0) {
    currentStroke = null;
    return;
  }
  
  // Convert standard arrays to Typed Arrays to eliminate IndexedDB clone lag
  undoStack.push({
    keys: new Uint32Array(currentStroke.keys),
    oldColors: new Uint32Array(currentStroke.oldColors),
    newColors: new Uint32Array(currentStroke.newColors),
    layerIndex: currentStroke.layerIndex
  });
  
  redoStack = [];
  currentStroke = null;
  debounceExtractCanvasColors();
}

export function popLastStroke() {
  if (undoStack.length === 0) return null;
  return undoStack.pop();
}

export function pushStrokeDirectly(stroke) {
  undoStack.push(stroke);
  redoStack = [];
  debounceExtractCanvasColors();
}

export function pushLayerState(oldLayers, oldActiveIndex, newLayers, newActiveIndex) {
  const cloneLayer = (ls) => ls.map(l => ({ ...l, pixelMap: new Uint32Array(l.pixelMap) }));
  undoStack.push({
    type: 'LAYER_STATE',
    oldLayers: cloneLayer(oldLayers),
    oldActiveIndex,
    newLayers: cloneLayer(newLayers),
    newActiveIndex
  });
  redoStack = [];
}

export function undo(pixelMap_ignored, renderFn) {
  if (undoStack.length === 0) return false;
  const stroke = undoStack.pop();
  redoStack.push(stroke);
  
  if (stroke.type === 'LAYER_STATE') {
    resetLayers(stroke.oldLayers, stroke.oldActiveIndex);
    window.dispatchEvent(new CustomEvent('layer-changed', { detail: { activeLayerIndex: stroke.oldActiveIndex, layers: stroke.oldLayers } }));
    renderFn();
    debounceExtractCanvasColors();
    window.dispatchEvent(new Event('history-undone'));
    return true;
  }
  
  const layer = layers[stroke.layerIndex] || layers[activeLayerIndex];
  if (!layer) return false;
  const targetMap = layer.pixelMap;
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const idx = stroke.keys[i];
    targetMap[idx] = stroke.oldColors[i];
  }
  
  renderFn();
  debounceExtractCanvasColors();
  window.dispatchEvent(new Event('history-undone'));
  return true;
}

export function redo(pixelMap_ignored, renderFn) {
  if (redoStack.length === 0) return false;
  const stroke = redoStack.pop();
  undoStack.push(stroke);
  
  if (stroke.type === 'LAYER_STATE') {
    resetLayers(stroke.newLayers, stroke.newActiveIndex);
    window.dispatchEvent(new CustomEvent('layer-changed', { detail: { activeLayerIndex: stroke.newActiveIndex, layers: stroke.newLayers } }));
    renderFn();
    debounceExtractCanvasColors();
    return true;
  }
  
  const layer = layers[stroke.layerIndex] || layers[activeLayerIndex];
  if (!layer) return false;
  const targetMap = layer.pixelMap;
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const idx = stroke.keys[i];
    targetMap[idx] = stroke.newColors[i];
  }
  
  renderFn();
  debounceExtractCanvasColors();
  return true;
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }
