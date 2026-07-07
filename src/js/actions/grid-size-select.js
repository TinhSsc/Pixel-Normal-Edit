import { t } from '../lang/i18n.js';
import {
  GRID_WIDTH, GRID_HEIGHT, els, setGridSizeParams, resetMaps, offscreenCtx
} from '../core/state.js';
import { resizeCanvas, fitToScreen } from '../core/viewport.js';
import { renderPixels, setForceFullRender } from '../core/render.js';
import { resetHistory } from '../core/history.js';
import { setStatus } from '../core/state.js';
import { debouncedSaveWorkspace, saveCurrentTabState } from '../core/tab-manager.js';
import { debounceExtractCanvasColors } from '../core/color-palette.js';

import { pixelMap } from '../core/state.js';

export function setGridSize(w, h, mode = 'clear', dx = 0, dy = 0) {
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

  setGridSizeParams(w, h, newData, newData32);
  
  if (mode === 'clear') {
    resetMaps();
  } else {
    resetMaps(new Uint32Array(newData32), new Map());
  }

  setForceFullRender(true);
  resizeCanvas();
  fitToScreen();
  renderPixels();
  
  syncGridSizeUI(w, h);
  
  setStatus(`Grid size set to ${w}x${h}`);
  
  resetHistory();
  saveCurrentTabState();
  debouncedSaveWorkspace();
  debounceExtractCanvasColors();
}

export function syncGridSizeUI(w, h) {
  const textMenu = document.getElementById('currentGridSizeText');
  if (textMenu) {
    textMenu.textContent = `${w}x${h}`;
  }
  
  const inputW = document.getElementById('resizeWidth');
  const inputH = document.getElementById('resizeHeight');
  if (inputW) inputW.value = w;
  if (inputH) inputH.value = h;
}

export function setupGridSizeSelect() {
  let pendingW = 0;
  let pendingH = 0;
  let lastEdited = 'width';

  const modal = document.getElementById('gridResizeModal');
  const label = document.getElementById('newGridSizeLabel');
  
  const btnMenu = document.getElementById('gridSizeSelectBtn');
  const popover = document.getElementById('resizePopover');
  const textMenu = document.getElementById('currentGridSizeText');
  
  const inputW = document.getElementById('resizeWidth');
  const inputH = document.getElementById('resizeHeight');
  const lockRatio = document.getElementById('resizeLockRatio');
  const previewText = document.getElementById('resizePreviewText');
  const applyBtn = document.getElementById('resizeApplyBtn');
  const presetBtns = document.querySelectorAll('.resize-preset-btn');

  // Helper function to update preview text
  const updatePreview = () => {
    if (previewText && inputW && inputH) {
      previewText.textContent = `${inputW.value} × ${inputH.value}`;
    }
  };

  if (btnMenu && popover) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      
      if (!isVisible) {
        // Init values from current GRID
        inputW.value = GRID_WIDTH;
        inputH.value = GRID_HEIGHT;
        updatePreview();
      }
      
      popover.style.display = isVisible ? 'none' : 'block';
    };
    
    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (popover.style.display === 'block' && !popover.contains(e.target) && !btnMenu.contains(e.target)) {
        popover.style.display = 'none';
      }
    }); // This might still duplicate on HMR, but document listeners are harder to overwrite safely. 
        // We'll leave it as addEventListener but it's safe because it just hides the popover if clicking outside.
    
    // Prevent closing when clicking inside popover
    popover.onclick = (e) => {
      e.stopPropagation();
    };
  }

  if (inputW && inputH && lockRatio) {
    inputW.addEventListener('input', () => {
      let w = parseInt(inputW.value) || 1;
      if (w < 1) w = 1;
      
      if (lockRatio.checked) {
        let h = Math.round(w * (GRID_HEIGHT / GRID_WIDTH));
        if (h < 1) h = 1;
        inputH.value = h;
      }
      lastEdited = 'width';
      updatePreview();
    });

    inputH.addEventListener('input', () => {
      let h = parseInt(inputH.value) || 1;
      if (h < 1) h = 1;
      
      if (lockRatio.checked) {
        let w = Math.round(h * (GRID_WIDTH / GRID_HEIGHT));
        if (w < 1) w = 1;
        inputW.value = w;
      }
      lastEdited = 'height';
      updatePreview();
    });
    
    // Handle checking the lock box
    lockRatio.addEventListener('change', () => {
       if (lockRatio.checked) {
         // Apply ratio based on last edited
         if (lastEdited === 'width') {
            let w = parseInt(inputW.value) || 1;
            let h = Math.round(w * (GRID_HEIGHT / GRID_WIDTH));
            inputH.value = Math.max(1, h);
         } else {
            let h = parseInt(inputH.value) || 1;
            let w = Math.round(h * (GRID_WIDTH / GRID_HEIGHT));
            inputW.value = Math.max(1, w);
         }
         updatePreview();
       }
    });
  }

  if (presetBtns) {
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size);
        if (inputW && inputH) {
          inputW.value = size;
          inputH.value = size;
          updatePreview();
        }
      });
    });
  }

  const applyResize = (mode) => {
    if (modal) modal.style.display = 'none';
    if (pendingW > 0 && pendingH > 0) {
      if (pendingW === GRID_WIDTH && pendingH === GRID_HEIGHT) {
         // Do nothing if sizes are the same
         return;
      }
      
      if (mode === 'keep') {
        window.dispatchEvent(new CustomEvent('open-resize-modal', { detail: { w: pendingW, h: pendingH } }));
      } else {
        setGridSize(pendingW, pendingH, mode);
        setStatus(`${t("status.sizeChanged")} ${pendingW}x${pendingH}`);
      }
    }
  };

  const btnKeep = document.getElementById('resizeKeepBtn');
  const btnScale = document.getElementById('resizeScaleBtn');
  const btnClear = document.getElementById('resizeClearBtn');

  if (btnKeep) btnKeep.addEventListener('click', () => applyResize('keep'));
  if (btnScale) btnScale.addEventListener('click', () => applyResize('scale'));
  if (btnClear) btnClear.addEventListener('click', () => applyResize('clear'));

  if (applyBtn) {
    applyBtn.onclick = () => {
      const w = parseInt(inputW.value) || GRID_WIDTH;
      const h = parseInt(inputH.value) || GRID_HEIGHT;
      
      if (w <= 0 || h <= 0) {
        alert(t("status.invalidSize"));
        return;
      }
      
      pendingW = w;
      pendingH = h;
      popover.style.display = 'none';
      
      if (w === GRID_WIDTH && h === GRID_HEIGHT) {
         return; // No change
      }
      
      // Mở modal để chọn cách đổi size
      if (modal && label) {
        label.textContent = `${pendingW}x${pendingH}`;
        modal.style.display = 'flex';
      } else {
        // Fallback
        applyResize('clear');
      }
    };
  }
}
