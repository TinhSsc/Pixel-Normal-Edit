let undoStack = [];
let redoStack = [];
let currentStroke = null;

import { debounceExtractCanvasColors } from './color-palette.js';

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
  currentStroke = { keys: [], oldColors: [], newColors: [] };
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
    newColors: new Uint32Array(currentStroke.newColors)
  });
  
  redoStack = [];
  currentStroke = null;
  debounceExtractCanvasColors();
}

export function undo(pixelMap, renderFn) {
  if (undoStack.length === 0) return false;
  const stroke = undoStack.pop();
  redoStack.push(stroke);
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const idx = stroke.keys[i];
    pixelMap[idx] = stroke.oldColors[i];
  }
  
  renderFn();
  debounceExtractCanvasColors();
  return true;
}

export function redo(pixelMap, renderFn) {
  if (redoStack.length === 0) return false;
  const stroke = redoStack.pop();
  undoStack.push(stroke);
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const idx = stroke.keys[i];
    pixelMap[idx] = stroke.newColors[i];
  }
  
  renderFn();
  debounceExtractCanvasColors();
  return true;
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }
