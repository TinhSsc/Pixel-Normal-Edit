import { t } from '../lang/i18n.js';
import {
  GRID_WIDTH, GRID_HEIGHT, els, setGridSizeParams, resetMaps, offscreenCtx
} from '../core/state.js';
import { resizeCanvas, fitToScreen } from '../core/viewport.js';
import { renderPixels } from '../core/render.js';
import { resetHistory } from '../core/history.js';
import { setStatus } from '../core/state.js';

export function setGridSize(w, h) {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = w;
  offscreenCanvas.height = h;
  const newCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  const newData = newCtx.createImageData(w, h);
  const newData32 = new Uint32Array(newData.data.buffer);

  setGridSizeParams(w, h, newData, newData32);
  resetMaps();
  resetHistory();
  resizeCanvas();
  fitToScreen();
  renderPixels();
}

export function syncGridSizeUI(w, h) {
  if (!els.gridSizeSelect) return;
  const newSize = `${w}x${h}`;
  const shortSize = w === h ? `${w}` : newSize;
  let opt = Array.from(els.gridSizeSelect.options).find(o => o.value === newSize || o.value === shortSize);
  
  if (!opt) {
    opt = document.createElement("option");
    opt.value = newSize;
    opt.text = newSize;
    els.gridSizeSelect.appendChild(opt);
  }
  els.gridSizeSelect.value = opt.value;
}

export function setupGridSizeSelect() {
  if (els.gridSizeSelect) {
    els.gridSizeSelect.addEventListener("change", () => {
      let newSize = els.gridSizeSelect.value;
      if (newSize === 'custom') {
        const input = prompt(t("status.sizePrompt"), "48");
        if (!input) {
          const oldOpt = Array.from(els.gridSizeSelect.options).find(o => o.value == GRID_WIDTH + "x" + GRID_HEIGHT || o.value == GRID_WIDTH);
          if (oldOpt) els.gridSizeSelect.value = oldOpt.value;
          return;
        }
        let w, h;
        if (input.includes('x') || input.includes('*')) {
          const parts = input.replace('*', 'x').split('x');
          w = parseInt(parts[0]); h = parseInt(parts[1]);
        } else { w = h = parseInt(input); }
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
          alert(t("status.invalidSize"));
          return;
        }
        newSize = `${w}x${h}`;
        const shortSize = w === h ? `${w}` : newSize;
        let opt = Array.from(els.gridSizeSelect.options).find(o => o.value === newSize || o.value === shortSize);
        if (!opt) {
          opt = document.createElement("option");
          opt.value = newSize; opt.text = newSize;
          els.gridSizeSelect.insertBefore(opt, els.gridSizeSelect.lastElementChild);
        }
        els.gridSizeSelect.value = opt.value;
        setGridSize(w, h);
        setStatus(`${t("status.sizeChanged")} ${newSize}`);
        return;
      }
      let w, h;
      if (newSize.includes('x')) { const p = newSize.split('x'); w = parseInt(p[0]); h = parseInt(p[1]); }
      else { w = h = parseInt(newSize); }
      setGridSize(w, h);
      setStatus(`${t("status.sizeChanged")} ${w}x${h}`);
    });
  }
}
