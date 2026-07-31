/**
 * Keyboard Shortcuts Manager
 * Hệ thống phím tắt tập trung – thay thế các keydown listeners rải rác.
 *
 * Quy tắc: File này chỉ đăng ký 1 listener toàn cục duy nhất.
 * Mọi shortcut đều được dispatch qua handleKeyDown() → executeShortcut().
 */

import {
  DEFAULT_SHORTCUTS,
  loadUserShortcuts,
  saveUserShortcuts,
  getShortcutDisplayString,
  resetShortcutsToDefault as configResetToDefault,
} from '../core/shortcuts-config.js';

import { setCurrentTool, activeLayerIndex, els } from '../core/state.js';
import { undo, redo } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { handleCopy, handleCut, handlePaste, handleDeleteSelection } from './clipboard.js';
import { zoomIn, zoomOut, fitToScreen } from '../core/viewport.js';
import {
  setGradientModeActive, isGradientModeActive,
  setMirrorModeActive, isMirrorModeActive,
} from '../core/pixel-writer.js';
import { setShowGrid, isShowGrid } from '../core/render.js';
import {
  toggleAnimationMode,
  toggleOnionSkin, showOnionSkin,
  addFrame, removeFrame,
  prevFrame, nextFrame, goToFrame,
  frames, activeFrameIndex,
} from '../core/animation-state.js';
import { addLayer, removeLayer, moveLayerUp, moveLayerDown } from '../core/layer-manager.js';
import { handleSelectUndo } from '../tools/select.js';
import { debouncedSaveWorkspace, performQuickSave } from '../core/tab-manager.js';
import { setStatus } from '../core/state.js';
import { t } from '../../../../i18n/i18n.js';

/* ------------------------------------------------------------------ */
/* State                                                                */
/* ------------------------------------------------------------------ */

let shortcuts = {};
let isInitialized = false;

// Chord (sequential key) support
let chordBuffer = [];
let chordTimeout = null;
const CHORD_TIMEOUT_MS = 1000;

/* ------------------------------------------------------------------ */
/* Action Handlers                                                      */
/* ------------------------------------------------------------------ */

function doSwapColors() {
  if (els.colorPicker && els.colorPicker2) {
    const a = els.colorPicker.value;
    const b = els.colorPicker2.value;
    els.colorPicker.value = b;
    els.colorPicker2.value = a;
    els.colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
    els.colorPicker2.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function doUndo() {
  if (handleSelectUndo()) return;
  const did = undo(null, renderPixels);
  if (did) {
    setStatus(t('status.undo'));
    debouncedSaveWorkspace();
  }
}

function doRedo() {
  const did = redo(null, renderPixels);
  if (did) {
    setStatus(t('status.redo'));
    debouncedSaveWorkspace();
  }
}

function doAnimPlayPause() {
  // Try to click the play/pause button if it exists in DOM
  const playBtn = document.querySelector('.anim-play-btn, #animPlayBtn, [data-action="play-pause"]');
  if (playBtn) {
    playBtn.click();
  }
}

const ACTION_HANDLERS = {
  // Tools – map to pixel editor tool IDs
  'tool.pixelPen':     () => setCurrentTool('pixel-pen'),
  'tool.highlightPen': () => setCurrentTool('highlight-pen'),
  'tool.blendBrush':   () => setCurrentTool('blend-brush'),
  'tool.ditherBrush':  () => setCurrentTool('dither-brush'),
  'tool.softBrush':    () => setCurrentTool('soft-brush'),
  'tool.sprayPen':     () => setCurrentTool('spray-pen'),
  'tool.eraser':       () => setCurrentTool('eraser'),
  'tool.picker':       () => setCurrentTool('picker'),
  'tool.fill':         () => setCurrentTool('fill'),
  'tool.magicEraser':  () => setCurrentTool('magic-eraser'),
  'tool.select':       () => setCurrentTool('select'),
  'tool.replaceColor': () => setCurrentTool('replace-color'),
  'tool.outline':      () => setCurrentTool('outline'),
  'tool.line':         () => setCurrentTool('line'),
  'tool.rect':         () => setCurrentTool('rect'),
  'tool.circle':       () => setCurrentTool('circle'),
  'tool.text':         () => setCurrentTool('text'),
  'tool.pan':          () => setCurrentTool('pan'),

  // Actions
  'action.undo':       doUndo,
  'action.redo':       doRedo,
  'action.redoAlt':    doRedo,
  'action.copy':       handleCopy,
  'action.cut':        handleCut,
  'action.paste':      handlePaste,
  'action.delete':     handleDeleteSelection,
  'action.selectAll':  () => { /* TODO: implement select all */ },
  'action.deselect':   () => { /* TODO: implement deselect */ },
  'action.swapColors': doSwapColors,
  'action.newCanvas':  () => document.getElementById('newCanvasBtn')?.click(),
  'action.quickSave':  performQuickSave,
  'action.saveAs':     () => { /* TODO: implement save as */ },
  'action.export':     () => document.getElementById('openDownloadModalBtn')?.click(),
  'action.settings':   () => document.getElementById('openSettingsBtn')?.click(),

  // Zoom
  'zoom.in':  zoomIn,
  'zoom.out': zoomOut,
  'zoom.fit': fitToScreen,

  // Modes
  'mode.gradient':  () => {
    const next = !isGradientModeActive();
    setGradientModeActive(next);
    // Sync checkbox if present
    const cb = document.getElementById('gradientMode');
    if (cb) cb.checked = next;
  },
  'mode.mirror': () => {
    const next = !isMirrorModeActive();
    setMirrorModeActive(next);
    const cb = document.getElementById('mirrorMode');
    if (cb) cb.checked = next;
  },
  'mode.grid': () => {
    const next = !isShowGrid();
    setShowGrid(next);
    renderPixels();
    const cb = document.getElementById('showGrid');
    if (cb) cb.checked = next;
  },
  'mode.animation': () => toggleAnimationMode(),
  'mode.onionSkin': () => toggleOnionSkin(),

  // Animation
  'anim.playPause':   doAnimPlayPause,
  'anim.prevFrame':   prevFrame,
  'anim.nextFrame':   nextFrame,
  'anim.firstFrame':  () => goToFrame(0),
  'anim.lastFrame':   () => { if (frames.length > 0) goToFrame(frames.length - 1); },
  'anim.addFrame':    addFrame,
  'anim.deleteFrame': () => { if (frames.length > 0) removeFrame(activeFrameIndex); },

  // Layers
  'layer.add':      addLayer,
  'layer.remove':   () => removeLayer(activeLayerIndex),
  'layer.moveUp':   () => moveLayerUp(activeLayerIndex),
  'layer.moveDown': () => moveLayerDown(activeLayerIndex),

  // Transforms – click the existing DOM buttons to reuse their full logic
  'transform.rotate': () => document.getElementById('rotateBtn')?.click(),
  'transform.flipH':  () => document.getElementById('flipHBtn')?.click(),
  'transform.flipV':  () => document.getElementById('flipVBtn')?.click(),
  'transform.trim':   () => document.getElementById('trimBtn')?.click(),
};

/* ------------------------------------------------------------------ */
/* Chord (G+D, G+M, etc.)                                              */
/* ------------------------------------------------------------------ */

function handleChord(e) {
  const key = e.key.toLowerCase();
  chordBuffer.push(key);
  console.log('[shortcuts] Chord buffer:', chordBuffer);

  if (chordBuffer.length === 2) {
    const chord = chordBuffer.join('');
    console.log('[shortcuts] Checking chord:', chord);
    if (chord === 'gd') {
      e.preventDefault();
      ACTION_HANDLERS['mode.gradient']();
    } else if (chord === 'gm') {
      e.preventDefault();
      ACTION_HANDLERS['mode.mirror']();
    } else if (chord === 'gg') {
      e.preventDefault();
      ACTION_HANDLERS['mode.grid']();
    } else {
      // Not a recognized chord, but we still consumed 2 keys
      console.log('[shortcuts] Not a recognized chord');
    }
    chordBuffer = [];
    if (chordTimeout) clearTimeout(chordTimeout);
    return;
  }

  if (chordTimeout) clearTimeout(chordTimeout);
  chordTimeout = setTimeout(() => { 
    console.log('[shortcuts] Chord timeout - clearing buffer');
    chordBuffer = []; 
  }, CHORD_TIMEOUT_MS);
}

/* ------------------------------------------------------------------ */
/* Core key-matching                                                    */
/* ------------------------------------------------------------------ */

function parseKeyboardEvent(e) {
  return {
    key:   e.key.toLowerCase(),
    ctrl:  e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt:   e.altKey,
  };
}

function findShortcutByConfig(config) {
  console.log('[shortcuts] Looking for match with config:', config);
  console.log('[shortcuts] Available shortcuts:', Object.entries(shortcuts).map(([id, s]) => ({ id, key: s.key, ctrl: s.ctrl, shift: s.shift, alt: s.alt })));
  
  for (const [id, s] of Object.entries(shortcuts)) {
    console.log('[shortcuts] Checking', id, ':', s.key, '===', config.key, '?', s.key === config.key);
    if (
      s.key === config.key &&
      !!s.ctrl  === config.ctrl  &&
      !!s.shift === config.shift &&
      !!s.alt   === config.alt
    ) {
      console.log('[shortcuts] MATCH FOUND:', id);
      return id;
    }
  }
  console.log('[shortcuts] NO MATCH');
  return null;
}

/* ------------------------------------------------------------------ */
/* Main handler                                                         */
/* ------------------------------------------------------------------ */

export function handleKeyDown(e) {
  console.log('[shortcuts] handleKeyDown called with key:', e.key, 'target:', e.target.tagName, 'target id:', e.target.id);
  
  // Skip when typing
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    console.log('[shortcuts] Skipping - in input/textarea');
    return;
  }
  // Skip when a modal is visible (except Ctrl/Meta combos)
  const modal = document.querySelector('.modal-overlay[style*="display: flex"]');
  if (modal && !e.ctrlKey && !e.metaKey) {
    console.log('[shortcuts] Skipping - modal open:', modal.id || modal.className);
    return;
  }

  // Chord tracking: reset on modifier combos
  if (e.ctrlKey || e.metaKey || e.altKey) {
    chordBuffer = [];
    if (chordTimeout) { clearTimeout(chordTimeout); chordTimeout = null; }
  } else {
    handleChord(e);
  }

  const keyConfig = parseKeyboardEvent(e);
  console.log('[shortcuts] Key pressed:', keyConfig);
  
  const shortcutId = findShortcutByConfig(keyConfig);
  console.log('[shortcuts] Found shortcut:', shortcutId);

  if (shortcutId && ACTION_HANDLERS[shortcutId]) {
    console.log('[shortcuts] Executing:', shortcutId);
    e.preventDefault();
    executeShortcut(shortcutId);
  } else {
    console.log('[shortcuts] No match found for key:', keyConfig.key);
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export function initKeyboardShortcuts() {
  if (isInitialized) return;
  isInitialized = true;

  shortcuts = loadUserShortcuts();
  
  console.log('[shortcuts] Initialized with shortcuts:', Object.keys(shortcuts));
  console.log('[shortcuts] tool.pixelPen config:', shortcuts['tool.pixelPen']);

  document.addEventListener('keydown', handleKeyDown);

  // Reload shortcuts when the Settings UI updates them
  window.addEventListener('shortcuts-updated', () => {
    shortcuts = loadUserShortcuts();
    console.log('[shortcuts] Reloaded shortcuts:', Object.keys(shortcuts));
  });
}

export function executeShortcut(shortcutId) {
  const handler = ACTION_HANDLERS[shortcutId];
  if (handler) {
    try {
      handler();
    } catch (err) {
      console.warn(`[keyboard-shortcuts] Failed to execute "${shortcutId}":`, err);
    }
  }
}

export function updateShortcut(shortcutId, newConfig) {
  shortcuts[shortcutId] = { 
    ...shortcuts[shortcutId], 
    ...newConfig,
    key: (newConfig.key || shortcuts[shortcutId]?.key || '').toLowerCase()
  };
  saveUserShortcuts(shortcuts);
  window.dispatchEvent(new Event('shortcuts-updated'));
}

export function getShortcuts() {
  return { ...shortcuts };
}

export function resetShortcutsToDefault() {
  shortcuts = configResetToDefault();
  saveUserShortcuts(shortcuts);
  window.dispatchEvent(new Event('shortcuts-updated'));
  return shortcuts;
}

// Re-export for convenience in UI components
export { getShortcutDisplayString };
