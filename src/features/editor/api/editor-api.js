import { undo, redo, canUndo, canRedo } from '../engine/core/history.js';
import { zoomIn, zoomOut, fitToScreen, getZoom, getPan, setZoom, setPan } from '../engine/core/viewport.js';
import { setGridSize } from '../engine/actions/grid-size-select.js';
import { autoTrimCanvas } from '../engine/actions/trim.js';
import { currentTool, GRID_WIDTH, GRID_HEIGHT } from '../engine/core/state.js';
import { getTabs, getActiveTabId, switchTab, createTabFromData, createNewTab, closeTab, renameTab, performQuickSave, syncToDrive, syncToLocal, debouncedSaveWorkspace } from '../engine/core/tab-manager.js';
import { getAnimationState, activeFrameIndex, addFrame, removeFrame, goToFrame, nextFrame, prevFrame, reorderFrame, isAnimationMode } from '../engine/core/animation-state.js';
import { ModeManager } from '../engine/core/mode-manager.js';

export const EditorAPI = {
  capabilities: {
    get: () => ({
      version: "2.0-foundation",
      features: ["workspace", "activeDocument", "modes", "storage"],
      formats: ["png", "webp", "jpeg", "json"]
    })
  },

  workspace: {
    listTabs: () => getTabs().map(t => ({ id: t.id, name: t.name, hasModifications: t.history?.undoStack?.length > 0 })),
    getActiveTabId: () => getActiveTabId(),
    switchTab: (tabId) => switchTab(tabId),
    createTab: (options = {}) => {
      if (options.pixelMap) {
        createTabFromData(options.pixelMap, options.width || 32, options.height || 32, options.name);
      } else {
        createNewTab();
      }
    },
    closeTab: (tabId, force = false) => closeTab(tabId, force),
    renameTab: (tabId, newName) => renameTab(tabId, newName),
    quickSave: () => performQuickSave(),
    saveToDrive: () => {
      const tabs = getTabs();
      const activeTab = tabs.find(t => t.id === getActiveTabId());
      if (activeTab) syncToDrive(activeTab);
    },
    saveToLocal: () => {
      const tabs = getTabs();
      const activeTab = tabs.find(t => t.id === getActiveTabId());
      if (activeTab) syncToLocal(activeTab);
    },
    forceAutoSave: () => debouncedSaveWorkspace()
  },

  activeDocument: {
    getState: () => {
      const tabs = getTabs();
      const activeTab = tabs.find(t => t.id === getActiveTabId());
      if (!activeTab) return null;
      return {
        id: activeTab.id,
        name: activeTab.name,
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        storage: activeTab.storage,
        format: activeTab.format,
        history: { canUndo: canUndo(), canRedo: canRedo() }
      };
    },

    canvas: {
      getSize: () => ({ width: GRID_WIDTH, height: GRID_HEIGHT }),
      resize: (w, h, mode = 'clear', dx = 0, dy = 0) => setGridSize(w, h, mode, dx, dy),
      clear: () => setGridSize(GRID_WIDTH, GRID_HEIGHT, 'clear'),
      trim: () => autoTrimCanvas()
    },

    viewport: {
      getZoom: () => getZoom(),
      getPan: () => getPan(),
      setZoom: (z) => setZoom(z),
      setPan: (x, y) => setPan(x, y),
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
      fitToScreen: () => fitToScreen()
    },

    animation: {
      isModeActive: () => isAnimationMode,
      getFrames: () => getAnimationState().frames,
      getActiveFrameIndex: () => activeFrameIndex,
      addFrame: () => addFrame(),
      removeFrame: (index) => removeFrame(index),
      goToFrame: (index) => goToFrame(index),
      nextFrame: () => nextFrame(),
      prevFrame: () => prevFrame(),
      reorderFrame: (from, to) => reorderFrame(from, to)
    }
  },

  modes: {
    getAll: () => ({
      gradient: ModeManager.getGradient(),
      mirror: ModeManager.getMirror(),
      grid: ModeManager.getGrid(),
      animation: ModeManager.getAnimation(),
      onionSkin: ModeManager.getOnionSkin()
    }),
    setGradient: (val) => ModeManager.setGradient(val),
    setMirror: (val) => ModeManager.setMirror(val),
    setGrid: (val) => ModeManager.setGrid(val),
    setAnimationMode: (val) => ModeManager.setAnimation(val),
    setOnionSkin: (val) => ModeManager.setOnionSkin(val)
  },
  
  // Hỗ trợ ngược cho code cũ / Vẫn có thể giữ để truy cập nhanh
  history: {
    undo: () => undo(),
    redo: () => redo()
  },
  tools: {
    getCurrent: () => currentTool
  }
};

export function initEditorAPI() {
  Object.defineProperty(window, 'PixelNormalEditAPI', {
    value: Object.freeze(EditorAPI),
    writable: false,
    configurable: false
  });
  console.log('✨ Pixel Normal Edit Public API v2 is ready at window.PixelNormalEditAPI');
}
