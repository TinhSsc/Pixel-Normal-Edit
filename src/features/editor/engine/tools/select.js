import { 
  selectionBox, setSelectionBox, 
  floatingSelection, setFloatingSelection, 
  pixelMap, GRID_WIDTH, GRID_HEIGHT 
} from '../core/state.js';
import { renderPixels } from '../core/render.js';
import { beginStroke, commitStroke, recordChange, popLastStroke, pushStrokeDirectly, undo } from '../core/history.js';

let isDragging = false;
let startCell = null;
let mode = 'none'; // 'create', 'move'
let offsetMove = { x: 0, y: 0 };
let originalFloatingState = null;

export function cancelSelection() {
  if (floatingSelection) {
    if (floatingSelection.isExtracted) {
      undo(pixelMap, () => renderPixels(false));
    }
    setFloatingSelection(null);
  }
  setSelectionBox(null);
  renderPixels(false);
}

window.addEventListener('tool-changed', (e) => {
  if (e.detail.tool !== 'select') {
    cancelSelection();
  }
});

export function isPointInBox(x, y, box) {
  if (!box) return false;
  return x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height;
}

export function handleSelectUndo() {
  if (floatingSelection) {
    if (floatingSelection.isExtracted) {
      undo(pixelMap, () => renderPixels(false));
    }
    setFloatingSelection(null);
    setSelectionBox(null);
    renderPixels(false);
    return true;
  }
  return false;
}

export function commitFloatingSelection() {
  if (!floatingSelection) return;
  
  let mergedStroke = null;
  if (floatingSelection.isExtracted) {
    mergedStroke = popLastStroke();
  }

  beginStroke();
  const { x, y, width, height, pixels } = floatingSelection;
  for (let iy = 0; iy < height; iy++) {
    for (let ix = 0; ix < width; ix++) {
      const px = x + ix;
      const py = y + iy;
      const color = pixels[iy * width + ix];
      // Only commit if within bounds and color is not transparent (0)
      if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT && color !== 0) {
        const idx = py * GRID_WIDTH + px;
        const oldColor = pixelMap[idx];
        if (oldColor !== color) {
          recordChange(idx, oldColor, color);
          pixelMap[idx] = color;
        }
      }
    }
  }
  if (mergedStroke) {
    commitStroke(pixelMap);
    const placementStroke = popLastStroke();
    if (!placementStroke) {
      pushStrokeDirectly(mergedStroke);
    } else {
      const combinedKeys = new Uint32Array(mergedStroke.keys.length + placementStroke.keys.length);
      combinedKeys.set(mergedStroke.keys);
      combinedKeys.set(placementStroke.keys, mergedStroke.keys.length);
      
      const combinedOld = new Uint32Array(mergedStroke.oldColors.length + placementStroke.oldColors.length);
      combinedOld.set(mergedStroke.oldColors);
      combinedOld.set(placementStroke.oldColors, mergedStroke.oldColors.length);
      
      const combinedNew = new Uint32Array(mergedStroke.newColors.length + placementStroke.newColors.length);
      combinedNew.set(mergedStroke.newColors);
      combinedNew.set(placementStroke.newColors, mergedStroke.newColors.length);
      
      pushStrokeDirectly({ keys: combinedKeys, oldColors: combinedOld, newColors: combinedNew });
    }
  } else {
    commitStroke(pixelMap);
  }
  setFloatingSelection(null);
  renderPixels(false);
}

export function extractSelectionToFloating() {
  if (!selectionBox) return;
  const { x, y, width, height } = selectionBox;
  const pixels = new Uint32Array(width * height);
  
  beginStroke();
  for (let iy = 0; iy < height; iy++) {
    for (let ix = 0; ix < width; ix++) {
      const px = x + ix;
      const py = y + iy;
      if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT) {
        const idx = py * GRID_WIDTH + px;
        const oldColor = pixelMap[idx];
        pixels[iy * width + ix] = oldColor;
        if (oldColor !== 0) {
          recordChange(idx, oldColor, 0);
          pixelMap[idx] = 0; // Clear it
        }
      } else {
        pixels[iy * width + ix] = 0;
      }
    }
  }
  commitStroke(pixelMap);
  
  setFloatingSelection({ x, y, width, height, pixels, isExtracted: true });
  setSelectionBox(null);
}

export function clearSelection() {
  setSelectionBox(null);
  if (floatingSelection) {
    commitFloatingSelection();
  }
  renderPixels(true);
}

export function useSelectTool(event, cell, color, prevCell) {
  if (event === 'down') {
    if (floatingSelection) {
      if (isPointInBox(cell.x, cell.y, floatingSelection)) {
        mode = 'move';
        isDragging = true;
        offsetMove = { x: cell.x - floatingSelection.x, y: cell.y - floatingSelection.y };
        originalFloatingState = { ...floatingSelection };
      } else {
        commitFloatingSelection();
        // Start new selection
        mode = 'create';
        isDragging = true;
        startCell = { ...cell };
        setSelectionBox({ x: cell.x, y: cell.y, width: 1, height: 1 });
      }
    } else if (selectionBox) {
      if (isPointInBox(cell.x, cell.y, selectionBox)) {
        extractSelectionToFloating();
        mode = 'move';
        isDragging = true;
        offsetMove = { x: cell.x - floatingSelection.x, y: cell.y - floatingSelection.y };
        originalFloatingState = { ...floatingSelection };
      } else {
        mode = 'create';
        isDragging = true;
        startCell = { ...cell };
        setSelectionBox({ x: cell.x, y: cell.y, width: 1, height: 1 });
      }
    } else {
      mode = 'create';
      isDragging = true;
      startCell = { ...cell };
      setSelectionBox({ x: cell.x, y: cell.y, width: 1, height: 1 });
    }
    renderPixels(true); // render dashed box
  } else if (event === 'move') {
    if (!isDragging) return;
    if (mode === 'create') {
      const minX = Math.min(startCell.x, cell.x);
      const maxX = Math.max(startCell.x, cell.x);
      const minY = Math.min(startCell.y, cell.y);
      const maxY = Math.max(startCell.y, cell.y);
      setSelectionBox({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
      renderPixels(true);
    } else if (mode === 'move' && floatingSelection) {
      floatingSelection.x = cell.x - offsetMove.x;
      floatingSelection.y = cell.y - offsetMove.y;
      renderPixels(true);
    }
  } else if (event === 'up') {
    if (!isDragging) return;
    isDragging = false;
    if (mode === 'create') {
      if (!selectionBox || selectionBox.width === 0 || selectionBox.height === 0) {
        setSelectionBox(null);
      }
    }
    mode = 'none';
  }
}
