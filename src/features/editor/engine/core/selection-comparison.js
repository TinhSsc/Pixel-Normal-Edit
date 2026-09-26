import { setSelectionBox } from './state.js';
import { createRatioSelectionBox, normalizeSelectionBox } from './selection-ratio.js';

export const SELECTION_COMPARISON_EVENT = 'selection-comparison-changed';

let state = {
  enabled: false,
  mainBox: null,
  compareBox: null,
  mainReference: null,
  activeTarget: 'main',
};

function cloneBox(box) {
  return box ? { ...box } : null;
}

function getActiveBox(snapshot = state) {
  return snapshot.activeTarget === 'compare' ? snapshot.compareBox : snapshot.mainBox;
}

function syncStandardSelection(snapshot = state) {
  setSelectionBox(snapshot.enabled ? cloneBox(getActiveBox(snapshot)) : null);
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SELECTION_COMPARISON_EVENT, { detail: getSelectionComparisonState() }));
}

export function getSelectionComparisonState() {
  return {
    enabled: state.enabled,
    mainBox: cloneBox(state.mainBox),
    compareBox: cloneBox(state.compareBox),
    mainReference: state.mainReference ? { ...state.mainReference } : null,
    activeTarget: state.activeTarget,
  };
}

export function isSelectionComparisonEnabled() {
  return state.enabled;
}

export function subscribeSelectionComparison(listener) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = (event) => listener(event.detail || getSelectionComparisonState());
  window.addEventListener(SELECTION_COMPARISON_EVENT, handleChange);
  return () => window.removeEventListener(SELECTION_COMPARISON_EVENT, handleChange);
}

export function setSelectionComparisonEnabled(enabled) {
  const nextEnabled = Boolean(enabled);
  if (state.enabled === nextEnabled) return;

  state = {
    enabled: nextEnabled,
    mainBox: null,
    compareBox: null,
    mainReference: null,
    activeTarget: 'main',
  };
  syncStandardSelection();
  emitChange();
}

export function resetSelectionComparison() {
  if (!state.mainBox && !state.compareBox && !state.mainReference && state.activeTarget === 'main') return;
  state.mainBox = null;
  state.compareBox = null;
  state.mainReference = null;
  state.activeTarget = 'main';
  syncStandardSelection();
  emitChange();
}

export function setMainReferenceSize(width, height) {
  if (!state.enabled) return;
  const normalizedWidth = Math.min(99999, Math.max(0, Math.round(Number(width) || 0)));
  const normalizedHeight = Math.min(99999, Math.max(0, Math.round(Number(height) || 0)));

  if (normalizedWidth < 1 || normalizedHeight < 1) {
    if (!state.mainReference) return;
    state.mainReference = null;
  } else {
    state.mainReference = { width: normalizedWidth, height: normalizedHeight };
  }

  emitChange();
}

export function setMainSelectionBox(box, advanceToCompare = false) {
  if (!state.enabled) return;
  const nextBox = normalizeSelectionBox(box);
  if (!nextBox) return;

  state.mainBox = nextBox;
  state.compareBox = null;
  state.activeTarget = advanceToCompare ? 'compare' : 'main';
  syncStandardSelection();
  emitChange();
}

export function setCompareSelectionBox(box) {
  if (!state.enabled) return;
  const nextBox = normalizeSelectionBox(box);
  if (!nextBox) return;

  state.compareBox = nextBox;
  state.activeTarget = 'compare';
  syncStandardSelection();
  emitChange();
}

export function setSelectionComparisonTarget(target) {
  if (!state.enabled || (target !== 'main' && target !== 'compare')) return;
  state.activeTarget = target;
  syncStandardSelection();
  emitChange();
}

export function selectEntireCanvasAsMain(width, height) {
  if (!state.enabled) return;
  const canvasWidth = Math.max(1, Math.round(Number(width) || 0));
  const canvasHeight = Math.max(1, Math.round(Number(height) || 0));

  state.mainBox = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  state.compareBox = null;
  state.activeTarget = 'compare';
  syncStandardSelection();
  emitChange();
}

export function applySelectionRatio(numerator, denominator) {
  if (!state.enabled || !state.mainBox) return null;
  const compareBox = createRatioSelectionBox(state.mainBox, numerator, denominator);
  if (!compareBox) return null;

  state.compareBox = compareBox;
  state.activeTarget = 'compare';
  syncStandardSelection();
  emitChange();
  return { ...compareBox };
}
