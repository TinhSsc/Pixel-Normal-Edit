import { undo, redo, canUndo, canRedo, beginStroke, commitStroke } from '../engine/core/history.js';
import { zoomIn, zoomOut, fitToScreen, getZoom, getPan, setZoom, setPan } from '../engine/core/viewport.js';
import { setGridSize } from '../engine/actions/grid-size-select.js';
import { autoTrimCanvas } from '../engine/actions/trim.js';
import { currentTool, setCurrentTool, GRID_WIDTH, GRID_HEIGHT, pixelMap, resetMaps, layers, activeLayerIndex } from '../engine/core/state.js';
import { getTabs, getActiveTabId, switchTab, createTabFromData, createNewTab, closeTab, renameTab, performQuickSave, syncToDrive, syncToLocal, debouncedSaveWorkspace } from '../engine/core/tab-manager.js';
import { addLayer, removeLayer, moveLayerUp, moveLayerDown, toggleLayerVisibility, selectLayer } from '../engine/core/layer-manager.js';
import { getAnimationState, activeFrameIndex, addFrame, removeFrame, goToFrame, nextFrame, prevFrame, reorderFrame, isAnimationMode, initAnimationFromCurrentState, insertFrameAt } from '../engine/core/animation-state.js';
import { ModeManager } from '../engine/core/mode-manager.js';

import { writePixel } from '../engine/core/pixel-writer.js';
import { renderPixels } from '../engine/core/render.js';
import { useFill } from '../engine/tools/fill.js';
import { uint32ToRgba, rgbaToHex, parseColorToUint32, parseUint32ToHex } from '../engine/core/color-utils.js';
import { generateWorkspacePngBlob } from '../io/export/export-png.js';
import { generateWorkspaceWebpBlob } from '../io/export/export-webp.js';
import { generateWorkspaceJpegBlob } from '../io/export/export-jpeg.js';
import { generateWorkspaceJsonBlob } from '../io/export/export-json.js';
import { exportAnimation } from '../io/export/export-animation.js';
import { executeCommand, executeCommandBatch } from './command-bus.js';
import { getElementValue, setElementValue } from '../../../shared/lib/dom-utils.js';
import { mcpClient } from './mcp-firebase-client.js';
import { t } from '../../../i18n/i18n.js';

export const EditorAPI = {
  capabilities: {
    get: () => ({
      version: "4.0-commandbus",
      features: ["workspace", "activeDocument", "modes", "storage", "tools", "color", "draw", "history", "io", "query", "commandbus"],
      formats: ["png", "webp", "jpeg", "json", "gif", "webm", "spritesheet"]
    })
  },

  commandBus: {
    execute: async (command) => await executeCommand(EditorAPI, command),
    executeBatch: async (commands) => await executeCommandBatch(EditorAPI, commands)
  },

  workspace: {
    listTabs: () => getTabs().map(t => ({ id: t.id, name: t.name, hasModifications: t.history?.undoStack?.length > 0 })),
    getActiveTabId: () => getActiveTabId(),
    switchTab: (tabId) => switchTab(tabId),
    createTab: (options = {}) => {
      if (options.pixelMap) {
        createTabFromData(options.pixelMap, options.width || 32, options.height || 32, options.name);
      } else {
        createNewTab(options.name, options.width, options.height);
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
      clear: () => {
        resetMaps();
        renderPixels();
        debouncedSaveWorkspace();
      },
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

    layers: {
      getLayers: () => layers.map((l, i) => ({
        index: i,
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        isActive: i === activeLayerIndex
      })),
      getActiveLayerIndex: () => activeLayerIndex,
      addLayer: () => addLayer(),
      removeLayer: (index) => removeLayer(index),
      moveLayerUp: (index) => moveLayerUp(index),
      moveLayerDown: (index) => moveLayerDown(index),
      toggleLayerVisibility: (index) => toggleLayerVisibility(index),
      selectLayer: (index) => selectLayer(index)
    },

    animation: {
      isModeActive: () => isAnimationMode,
      getFrames: () => getAnimationState()?.frames || [],
      getActiveFrameIndex: () => activeFrameIndex,
      init: () => initAnimationFromCurrentState(),
      addFrame: () => addFrame(),
      insertFrameAt: (index) => insertFrameAt(index),
      removeFrame: (index) => removeFrame(index),
      goToFrame: (index) => goToFrame(index),
      nextFrame: () => nextFrame(),
      prevFrame: () => prevFrame(),
      reorderFrame: (from, to) => reorderFrame(from, to),
      query: {
        getDifferences: (frameIndex1, frameIndex2) => {
          const state = getAnimationState();
          if (!state || !state.frames) return [];
          const frames = state.frames;
          if (frameIndex1 < 0 || frameIndex1 >= frames.length || frameIndex2 < 0 || frameIndex2 >= frames.length) {
            throw new Error(t('editorApi.invalidFrameIndex'));
          }
          const f1 = frames[frameIndex1];
          const f2 = frames[frameIndex2];
          if (f1.width !== f2.width || f1.height !== f2.height) {
            throw new Error(t('editorApi.framesDifferentDims'));
          }
          const w = f1.width;
          const h = f1.height;
          const diffs = [];
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              const c1 = f1.pixelMap[idx];
              const c2 = f2.pixelMap[idx];
              if (c1 !== c2) {
                diffs.push({
                  x,
                  y,
                  color1: c1 === 0 ? 'transparent' : parseUint32ToHex(c1),
                  color2: c2 === 0 ? 'transparent' : parseUint32ToHex(c2)
                });
              }
            }
          }
          return diffs;
        }
      }
    },

    history: {
      undo: () => undo(pixelMap, renderPixels),
      redo: () => redo(pixelMap, renderPixels),
      beginTransaction: () => beginStroke(),
      commitTransaction: () => {
        commitStroke(pixelMap);
        renderPixels();
        debouncedSaveWorkspace();
      }
    },

    draw: {
      getPixel: (x, y) => {
        if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return null;
        const idx = y * GRID_WIDTH + x;
        const rgba = uint32ToRgba(pixelMap[idx]);
        return rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
      },
      setPixel: (x, y, colorHex, options = {}) => {
        writePixel(x, y, colorHex, options);
        renderPixels();
      },
      fill: async (x, y, colorHex) => {
        await useFill({ x, y }, colorHex);
      }
    },

    io: {
      export: async (format, options = { transparent: true }) => {
        const tabs = getTabs();
        const activeTab = tabs.find(t => t.id === getActiveTabId());
        if (!activeTab) throw new Error(t('editorApi.noActiveTab'));

        switch (format) {
          case 'png': return await generateWorkspacePngBlob(activeTab, options);
          case 'webp': return await generateWorkspaceWebpBlob(activeTab, options);
          case 'jpeg': return await generateWorkspaceJpegBlob(activeTab, options);
          case 'json': return generateWorkspaceJsonBlob(activeTab);
          default: throw new Error(t('editorApi.unsupportedFormat', format));
        }
      },
      exportAnimation: async (format, options = {}) => {
        const tabs = getTabs();
        const activeTab = tabs.find(t => t.id === getActiveTabId());
        if (!activeTab) throw new Error(t('editorApi.noActiveTab'));
        return await exportAnimation(activeTab, format, options);
      }
    },

    query: {
      isEmpty: () => {
        for (let i = 0; i < pixelMap.length; i++) {
          if (pixelMap[i] !== 0) return false;
        }
        return true;
      },
      getBoundingBox: () => {
        let minX = GRID_WIDTH, minY = GRID_HEIGHT, maxX = -1, maxY = -1;
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < GRID_WIDTH; x++) {
            if (pixelMap[y * GRID_WIDTH + x] !== 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX === -1) return null;
        return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
      },
      getPalette: () => {
        const colorSet = new Set();
        for (let i = 0; i < pixelMap.length; i++) {
          if (pixelMap[i] !== 0) colorSet.add(pixelMap[i]);
        }
        return Array.from(colorSet).map(parseUint32ToHex);
      },
      countPixels: (colorHex) => {
        const targetUint32 = parseColorToUint32(colorHex);
        let count = 0;
        for (let i = 0; i < pixelMap.length; i++) {
          if (pixelMap[i] === targetUint32) count++;
        }
        return count;
      },
      findPixels: (colorHex) => {
        const targetUint32 = parseColorToUint32(colorHex);
        const result = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < GRID_WIDTH; x++) {
            if (pixelMap[y * GRID_WIDTH + x] === targetUint32) {
              result.push({ x, y });
            }
          }
        }
        return result;
      },
      getRawPixelMap: () => new Uint32Array(pixelMap)
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

  tools: {
    get: () => currentTool,
    set: (toolId) => setCurrentTool(toolId),
    getParam: (paramId) => getElementValue(paramId),
    setParam: (paramId, value) => setElementValue(paramId, value)
  },

  color: {
    getPrimary: () => getElementValue('colorPicker'),
    getSecondary: () => getElementValue('colorPicker2'),
    setPrimary: (hex) => setElementValue('colorPicker', hex),
    setSecondary: (hex) => setElementValue('colorPicker2', hex),
    swap: () => {
      const p = getElementValue('colorPicker');
      const s = getElementValue('colorPicker2');
      if (p !== undefined && s !== undefined) {
        setElementValue('colorPicker', s);
        setElementValue('colorPicker2', p);
      }
    }
  }
};

export function initEditorAPI() {
  // Cho phép configurable = true để Vite HMR có thể ghi đè object khi code thay đổi
  Object.defineProperty(window, 'PixelNormalEditAPI', {
    value: Object.freeze(EditorAPI),
    writable: false,
    configurable: true
  });
  console.log('Pixel Normal Edit Public API is ready at window.PixelNormalEditAPI');
  
  // Khởi tạo MCP Firebase Client với bảo mật Session ID
  const urlParams = new URLSearchParams(window.location.search);
  let sessionId = urlParams.get('mcp_session');
  
  if (!sessionId) {
    // Generate secure random UUID (36 chars)
    sessionId = crypto.randomUUID();
    // Update URL without reloading page
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('mcp_session', sessionId);
    window.history.replaceState({}, '', newUrl.toString());
  }

  mcpClient.initialize(EditorAPI.commandBus, sessionId);
  
  // Phát sự kiện để cập nhật giao diện
  window.dispatchEvent(new CustomEvent('ai-connection-status', {
    detail: { type: 'waiting', text: `Đang chờ kết nối...`, sessionId }
  }));
}
