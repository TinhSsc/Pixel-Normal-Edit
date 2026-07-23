import { 
  textToolState, setTextToolState,
  selectionBox, setSelectionBox, 
  pixelMap, GRID_WIDTH, GRID_HEIGHT 
} from '../core/state.js';
import { renderPixels } from '../core/render.js';
import { rasterizeText } from '../algorithms/text-algo.js';

let isDragging = false;
let startCell = null;

export function commitTextTool() {
  if (textToolState.isActive) {
    if (textToolState.text.trim().length > 0) {
      rasterizeText(textToolState, pixelMap, GRID_WIDTH, GRID_HEIGHT);
    }
    setTextToolState({ isActive: false, isEditing: false, text: "", box: null });
    renderPixels(true);
  }
}

export function cancelTextTool() {
  if (textToolState.isActive) {
    setTextToolState({ isActive: false, isEditing: false, text: "", box: null });
    renderPixels(true);
  }
}

window.addEventListener('tool-changed', (e) => {
  if (e.detail.tool !== 'text') {
    commitTextTool();
  }
});

// Sync DOM inputs with textToolState so React UI updates live
document.body.addEventListener('input', (e) => {
  if (['textToolFont', 'textToolSize', 'textToolBold', 'textToolItalic'].includes(e.target.id)) {
    let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.id === 'textToolSize') val = parseInt(val, 10) || 16;
    let key = e.target.id.replace('textTool', '').toLowerCase();
    
    setTextToolState({ [key]: val });
  }

  // If color changes while editing text, apply to text
  if (e.target.id === 'colorPicker' && textToolState.isActive) {
    setTextToolState({ color: e.target.value });
  }
});

// Update DOM inputs when React state changes (e.g. initial load or cancel)
window.addEventListener('text-tool-updated', (e) => {
  const state = e.detail;
  if (!state) return;
  
  const fontEl = document.getElementById('textToolFont');
  if (fontEl && fontEl.value !== state.font) fontEl.value = state.font;

  const sizeEl = document.getElementById('textToolSize');
  if (sizeEl && parseInt(sizeEl.value, 10) !== state.size) sizeEl.value = state.size;

  const boldEl = document.getElementById('textToolBold');
  if (boldEl && boldEl.checked !== state.bold) boldEl.checked = state.bold;

  const italicEl = document.getElementById('textToolItalic');
  if (italicEl && italicEl.checked !== state.italic) italicEl.checked = state.italic;
});

export function useTextTool(event, cell, color, prevCell) {
  if (event === 'down') {
    // If clicking outside the active box, commit it
    if (textToolState.isActive) {
      commitTextTool();
      // Don't start a new box on the same click to avoid accidental tiny boxes
      return;
    }

    isDragging = true;
    startCell = { ...cell };
    setSelectionBox({ x: cell.x, y: cell.y, width: 1, height: 1 });
    renderPixels(true);
  } else if (event === 'move') {
    if (!isDragging) return;
    
    const minX = Math.min(startCell.x, cell.x);
    const maxX = Math.max(startCell.x, cell.x);
    const minY = Math.min(startCell.y, cell.y);
    const maxY = Math.max(startCell.y, cell.y);
    
    setSelectionBox({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
    renderPixels(true);
  } else if (event === 'up') {
    if (!isDragging) return;
    isDragging = false;
    
    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
      setTextToolState({
        isActive: true,
        isEditing: true, // Auto focus editing when drawn
        box: { ...selectionBox },
        text: "",
        color: color || "#000000"
      });
      setSelectionBox(null);
      renderPixels(true);
    } else {
      setSelectionBox(null);
      renderPixels(true);
    }
  }
}
