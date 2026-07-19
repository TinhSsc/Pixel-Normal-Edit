import { 
  selectionBox, floatingSelection, clipboardData, setClipboardData, setFloatingSelection,
  pixelMap, GRID_WIDTH, GRID_HEIGHT, setCurrentTool, setStatus
} from '../core/state.js';
import { extractSelectionToFloating, commitFloatingSelection, clearSelection } from '../tools/select.js';
import { renderPixels } from '../core/render.js';
import { beginStroke, commitStroke, recordChange } from '../core/history.js';
import { t } from '../../../../i18n/i18n.js';

export function handleCopy() {
  if (floatingSelection) {
    const { width, height, pixels } = floatingSelection;
    setClipboardData({ width, height, pixels: new Uint32Array(pixels) });
    setStatus(t('status.copied') || 'Đã sao chép');
  } else if (selectionBox) {
    const { x, y, width, height } = selectionBox;
    const pixels = new Uint32Array(width * height);
    for (let iy = 0; iy < height; iy++) {
      for (let ix = 0; ix < width; ix++) {
        const px = x + ix;
        const py = y + iy;
        if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT) {
          pixels[iy * width + ix] = pixelMap[py * GRID_WIDTH + px];
        } else {
          pixels[iy * width + ix] = 0;
        }
      }
    }
    setClipboardData({ width, height, pixels });
    setStatus(t('status.copied') || 'Đã sao chép');
  }
}

export function handleCut() {
  if (floatingSelection) {
    handleCopy();
    setFloatingSelection(null);
    clearSelection();
  } else if (selectionBox) {
    handleCopy();
    beginStroke();
    const { x, y, width, height } = selectionBox;
    for (let iy = 0; iy < height; iy++) {
      for (let ix = 0; ix < width; ix++) {
        const px = x + ix;
        const py = y + iy;
        if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT) {
          const idx = py * GRID_WIDTH + px;
          const oldColor = pixelMap[idx];
          if (oldColor !== 0) {
            recordChange(idx, oldColor, 0);
            pixelMap[idx] = 0;
          }
        }
      }
    }
    commitStroke(pixelMap);
    clearSelection();
  }
}

export function handlePaste() {
  if (!clipboardData) return;
  
  // If there is an existing floating selection, commit it first
  if (floatingSelection) {
    commitFloatingSelection();
  }

  const { width, height, pixels } = clipboardData;
  // Paste at center of the grid, or maybe top-left
  const x = Math.max(0, Math.floor((GRID_WIDTH - width) / 2));
  const y = Math.max(0, Math.floor((GRID_HEIGHT - height) / 2));

  setFloatingSelection({ x, y, width, height, pixels: new Uint32Array(pixels) });
  
  // Switch to select tool so the user can move the pasted selection
  setCurrentTool('select');
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.tool-btn[data-tool="select"]');
  if (btn) btn.classList.add('active');
  
  renderPixels(true);
  setStatus(t('status.pasted') || 'Đã dán');
}

export function handleDeleteSelection() {
  if (floatingSelection) {
    setFloatingSelection(null);
    clearSelection();
  } else if (selectionBox) {
    beginStroke();
    const { x, y, width, height } = selectionBox;
    for (let iy = 0; iy < height; iy++) {
      for (let ix = 0; ix < width; ix++) {
        const px = x + ix;
        const py = y + iy;
        if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT) {
          const idx = py * GRID_WIDTH + px;
          const oldColor = pixelMap[idx];
          if (oldColor !== 0) {
            recordChange(idx, oldColor, 0);
            pixelMap[idx] = 0;
          }
        }
      }
    }
    commitStroke(pixelMap);
    clearSelection();
  }
}
