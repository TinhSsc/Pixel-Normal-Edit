let undoStack = [];
let redoStack = [];
let currentStroke = null;

export function resetHistory() {
  undoStack = [];
  redoStack = [];
  currentStroke = null;
}

export function beginStroke() {
  currentStroke = { keys: [], oldColors: [], newColors: [] };
}

export function recordChange(arg1, arg2, arg3, arg4) {
  if (!currentStroke) return;
  
  let key, oldColor, newColor;
  if (arg4 !== undefined) {
    // legacy (x, y, oldColor, newColor)
    key = (arg1 << 16) | arg2;
    oldColor = arg3;
    newColor = arg4;
  } else {
    // new (key, oldColor, newColor)
    key = arg1;
    oldColor = arg2;
    newColor = arg3;
  }
  
  currentStroke.keys.push(key);
  currentStroke.oldColors.push(oldColor);
  currentStroke.newColors.push(newColor);
}

export function commitStroke(pixelMap) {
  if (!currentStroke || currentStroke.keys.length === 0) {
    currentStroke = null;
    return;
  }
  undoStack.push(currentStroke);
  redoStack = [];
  currentStroke = null;
}

export function undo(pixelMap, renderFn) {
  if (undoStack.length === 0) return false;
  const stroke = undoStack.pop();
  redoStack.push(stroke);
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const key = stroke.keys[i];
    const oldColor = stroke.oldColors[i];
    if (oldColor === null) {
      pixelMap.delete(key);
    } else {
      pixelMap.set(key, oldColor);
    }
  }
  
  renderFn();
  return true;
}

export function redo(pixelMap, renderFn) {
  if (redoStack.length === 0) return false;
  const stroke = redoStack.pop();
  undoStack.push(stroke);
  
  for (let i = 0; i < stroke.keys.length; i++) {
    const key = stroke.keys[i];
    const newColor = stroke.newColors[i];
    if (newColor === null) {
      pixelMap.delete(key);
    } else {
      pixelMap.set(key, newColor);
    }
  }
  
  renderFn();
  return true;
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }
