/**
 * quick-color-select.js — "Chọn nhanh theo màu" cho panel Tỷ lệ vùng chọn
 *
 * Luồng: bật chế độ → bấm 1 pixel trên canvas → lan ra vùng liền kề cùng màu
 *        → lấy hình chữ nhật bao quanh → đặt làm Main hoặc Ô phụ.
 *
 * Không sửa pixel nào: chỉ đọc pixelMap rồi đặt vùng chọn.
 */

import { pixelMap, GRID_WIDTH, GRID_HEIGHT, setStatus } from './state.js';
import { renderPixels, setForceFullRender } from './render.js';
import { t } from '../../../../i18n/i18n.js';
import {
  findColorRegion,
  setQuickRegionMask,
  clearQuickRegionMask,
} from './color-region-select.js';
import {
  getSelectionComparisonState,
  isSelectionComparisonEnabled,
  selectEntireCanvasAsMain,
  setCompareSelectionBox,
  setMainSelectionBox,
  setSelectionComparisonTarget,
  subscribeSelectionComparison,
} from './selection-comparison.js';

let state = {
  armed: false,
  target: 'compare',
  tolerance: 0,
  contiguous: true,
  lastResult: null,
};

const listeners = new Set();

function notify() {
  const snapshot = getQuickColorSelectState();
  for (const listener of listeners) listener(snapshot);
}

export function getQuickColorSelectState() {
  return { ...state };
}

export function subscribeQuickColorSelect(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isQuickColorSelectArmed() {
  return state.armed;
}

function redraw() {
  setForceFullRender(true);
  renderPixels();
}

export function setQuickColorSelectArmed(armed) {
  const next = Boolean(armed);
  if (state.armed === next) return;

  state = { ...state, armed: next };
  if (!next) {
    clearQuickRegionMask();
    state = { ...state, lastResult: null };
    redraw();
  }
  notify();
}

export function toggleQuickColorSelect() {
  setQuickColorSelectArmed(!state.armed);
}

export function setQuickColorSelectOptions(options = {}) {
  const next = { ...state };

  if (options.target === 'main' || options.target === 'compare') {
    next.target = options.target;
  }
  if (options.tolerance !== undefined) {
    const value = Math.round(Number(options.tolerance));
    next.tolerance = Number.isFinite(value) ? Math.min(255, Math.max(0, value)) : 0;
  }
  if (options.contiguous !== undefined) {
    next.contiguous = Boolean(options.contiguous);
  }

  if (next.target === state.target && next.tolerance === state.tolerance && next.contiguous === state.contiguous) {
    return;
  }

  state = next;
  notify();
}

export function resetQuickColorSelect() {
  const hadResult = Boolean(state.lastResult) || state.armed;
  state = { armed: false, target: 'compare', tolerance: 0, contiguous: true, lastResult: null };
  clearQuickRegionMask();
  if (hadResult) redraw();
  notify();
}

/**
 * Chạy chọn nhanh tại 1 ô canvas.
 * @returns {{ok: boolean, reason?: string, region?: object}}
 */
export function applyQuickColorSelectAt(cell) {
  if (!isSelectionComparisonEnabled()) {
    setStatus(t('selectionRatio.quickSelectNeedPanel'), true);
    return { ok: false, reason: 'disabled' };
  }
  if (!cell) return { ok: false, reason: 'no-cell' };

  const region = findColorRegion(pixelMap, GRID_WIDTH, GRID_HEIGHT, cell.x, cell.y, {
    tolerance: state.tolerance,
    contiguous: state.contiguous,
  });

  if (!region || !region.box) {
    setStatus(t('selectionRatio.quickSelectTransparent'), true);
    return { ok: false, reason: 'transparent', region };
  }

  const comparison = getSelectionComparisonState();

  // Chọn Ô phụ mà chưa có Main → lấy toàn canvas làm Main để có tỷ lệ so sánh.
  if (state.target === 'compare') {
    if (!comparison.mainBox) selectEntireCanvasAsMain(GRID_WIDTH, GRID_HEIGHT);
    setCompareSelectionBox(region.box);
  } else {
    setMainSelectionBox(region.box);
  }
  setSelectionComparisonTarget(state.target);

  setQuickRegionMask(region.mask, GRID_WIDTH, GRID_HEIGHT);
  state = {
    ...state,
    lastResult: {
      count: region.count,
      colorHex: region.colorHex,
      truncated: region.truncated,
      target: state.target,
      box: region.box,
    },
  };

  redraw();
  notify();

  const targetLabel = t(state.target === 'main' ? 'selectionRatio.main' : 'selectionRatio.compare');
  setStatus(t(
    'selectionRatio.quickSelectResult',
    region.count,
    region.colorHex,
    region.box.width,
    region.box.height,
    targetLabel,
  ));

  return { ok: true, region };
}

// ── Tự tắt khi không còn dùng được ──────────────────────────────────────
subscribeSelectionComparison((comparison) => {
  if (!comparison.enabled) resetQuickColorSelect();
});

if (typeof window !== 'undefined') {
  window.addEventListener('tool-changed', (event) => {
    if (event.detail?.tool !== 'select') resetQuickColorSelect();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.armed) setQuickColorSelectArmed(false);
  });
}
