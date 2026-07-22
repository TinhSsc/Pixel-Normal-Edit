import { pixelMap, groupMap, GRID_WIDTH, GRID_HEIGHT, offscreenImageData, offscreenData32, setGridSizeParams, resetMaps, els } from './state.js';
import { getHistoryState, setHistoryState } from './history.js';
import { renderPixels } from './render.js';
import { resizeCanvas, fitToScreen } from './viewport.js';
import { t } from '../../../../i18n/i18n.js';
import { syncGridSizeUI } from '../actions/grid-size-select.js';
import { setSourceImage, updateBgButtonsUI } from '../actions/set-background.js';
import { saveWorkspace } from './storage.js';
import { generateWorkspacePngBlob } from '../../io/export/export-png.js';
import { generateWorkspaceJpegBlob } from '../../io/export/export-jpeg.js';
import { generateWorkspaceWebpBlob } from '../../io/export/export-webp.js';
import { generateWorkspaceJsonBlob } from '../../io/export/export-json.js';
import { uploadToDrive, getDriveToken, ensureDriveLogin } from '../../../storage/cloud/drive-api.js';
import { saveFileToLocalDrive, getCurrentDirectoryHandle } from '../../../storage/local/local-drive.js';
import { showNotification } from '../../../storage/cloud/drive-ui.js';
import { debounceExtractCanvasColors } from './color-palette.js';
import { getAnimationState, setAnimationState, loadFrameToCurrentState } from './animation-state.js';
import { setPreviewBackground, removePreviewBackground } from './preview-group-manager.js';

let tabs = [];
let activeTabId = null;
let tabCounter = 1;

export function getTabs() { return tabs; }
export function getActiveTabId() { return activeTabId; }

export function updateTabMetadata(id, meta) {
  const tab = tabs.find(t => t.id === id);
  if (tab) {
    if (!tab.meta) tab.meta = {};
    Object.assign(tab.meta, meta);
  }
}

function generateId() {
  return 'tab_' + Math.random().toString(36).substr(2, 9);
}

let saveTimeout = null;
let maxWaitTimeout = null;

export function clearPendingSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  if (maxWaitTimeout) clearTimeout(maxWaitTimeout);
}

let isUploadingDrive = false;
let isUploadingLocal = false;

function setHeaderStatus(statusText) {
  const indicator = document.getElementById('saveStatusIndicator');
  if (indicator) {
    if (statusText === 'saving') {
      indicator.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:12px;height:12px"></i> <span data-i18n="status.saving">${t('status.saving') || 'Đang lưu...'}</span>`;
      indicator.style.color = 'var(--pixel-blue)';
    } else if (statusText.startsWith('saved')) {
      let text = t('status.saved') || 'Đã lưu';
      if (statusText === 'saved-drive') text += ' (Drive)';
      else if (statusText === 'saved-local') text += ' (Máy)';
      else if (statusText === 'saved-both') text += ' (Cả hai)';
      
      indicator.innerHTML = `<i data-lucide="check" style="width:12px;height:12px"></i> <span>${text}</span>`;
      indicator.style.color = 'var(--success)';
      setTimeout(() => { if (indicator.innerHTML.includes('check')) indicator.innerHTML = ''; }, 3000);
    } else if (statusText === 'error') {
      indicator.innerHTML = `<i data-lucide="x" style="width:12px;height:12px"></i> <span data-i18n="status.syncError">${t('status.syncError') || 'Lỗi đồng bộ'}</span>`;
      indicator.style.color = 'var(--color-danger)';
    } else {
      indicator.innerHTML = '';
    }
    if (window.lucide) window.lucide.createIcons({ root: indicator });
  }
}

async function getBlobForTab(tab) {
  const format = tab.format || 'png';
  if (format === 'json') return new Blob([generateWorkspaceJsonBlob(tab)], { type: 'application/json' });
  if (format === 'jpeg') return await generateWorkspaceJpegBlob(tab);
  if (format === 'webp') return await generateWorkspaceWebpBlob(tab);
  return await generateWorkspacePngBlob(tab);
}

function getExtForTab(tab) {
  const format = tab.format || 'png';
  if (format === 'jpeg') return 'jpg';
  return format;
}

export async function syncToDrive(tab) {
  if (isUploadingDrive) return false;
  isUploadingDrive = true;
  setHeaderStatus('saving');
  try {
    const blob = await getBlobForTab(tab);
    const fileName = `${tab.name || 'pixel-art'}.${getExtForTab(tab)}`;
    const fileId = tab.storage.type === 'drive' ? tab.storage.id : null;
    const newFileId = await uploadToDrive(fileName, blob, fileId);

    // Nếu lưu thành công, cập nhật storage
    tab.storage = { type: 'drive', id: newFileId, handle: null, name: fileName };
    return true;
  } catch (err) {
    console.error("Drive sync failed:", err);
    setHeaderStatus('error');
    return false;
  } finally {
    isUploadingDrive = false;
  }
}

export async function syncToLocal(tab) {
  if (isUploadingLocal) return false;
  isUploadingLocal = true;
  setHeaderStatus('saving');
  try {
    const blob = await getBlobForTab(tab);
    const fileName = `${tab.name || 'pixel-art'}.${getExtForTab(tab)}`;

    // Nếu tab đã được link với một file handle (đã mở hoặc save as qua local)
    // Thực tế File System Access API cho phép lấy file handle từ directory handle.
    // Nếu tab.storage.handle có tồn tại thì có thể ghi trực tiếp, tuy nhiên để đơn giản, ta lưu qua saveFileToLocalDrive
    await saveFileToLocalDrive(fileName, blob);

    // Cập nhật storage
    tab.storage = { type: 'local', id: null, handle: null, name: fileName };
    return true;
  } catch (err) {
    console.error("Local sync failed:", err);
    setHeaderStatus('error');
    return false;
  } finally {
    isUploadingLocal = false;
  }
}

export async function performQuickSave() {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (!currentTab) return;

  saveCurrentTabState();
  saveWorkspace(tabs, activeTabId);

  let success = false;

  if (currentTab.storage && currentTab.storage.type === 'drive') {
    success = await syncToDrive(currentTab);
    if (success) { setHeaderStatus('saved-drive'); showNotification(t('status.savedToDrive')); }
  } else if (currentTab.storage && currentTab.storage.type === 'local') {
    success = await syncToLocal(currentTab);
    if (success) { setHeaderStatus('saved-local'); showNotification(t('status.savedToLocal')); }
  } else if (getCurrentDirectoryHandle()) {
    // Nếu đã cấu hình local directory mà tab chưa link đâu, lưu vào local dir
    success = await syncToLocal(currentTab);
    if (success) { setHeaderStatus('saved-local'); showNotification(t('status.fileCreatedLocal')); }
  } else {
    // Không có link nào, mở Save As
    const btn = document.getElementById('openDownloadModalBtn');
    if (btn) btn.click();
    return;
  }
}

async function performAutoSave() {
  const currentTab = tabs.find(t => t.id === activeTabId);
  saveCurrentTabState();
  saveWorkspace(tabs, activeTabId);

  const dest = localStorage.getItem('auto_save_destination') || 'drive';
  if (dest === 'none' || !currentTab) return;

  let successDrive = false;
  let successLocal = false;

  if (dest === 'drive' || dest === 'both') {
    if (getDriveToken()) {
      successDrive = await syncToDrive(currentTab);
    }
  }

  if (dest === 'local' || dest === 'both') {
    if (getCurrentDirectoryHandle()) {
      successLocal = await syncToLocal(currentTab);
    }
  }

  if (successDrive && successLocal) {
    setHeaderStatus('saved-both');
  } else if (successDrive) {
    setHeaderStatus('saved-drive');
  } else if (successLocal) {
    setHeaderStatus('saved-local');
  }
}

export function debouncedSaveWorkspace() {
  if (saveTimeout) clearTimeout(saveTimeout);

  setHeaderStatus('');
  // Dirty state: you can add '*' to tab name or header, but keeping it simple for now

  // Debounce 5s
  saveTimeout = setTimeout(async () => {
    if (maxWaitTimeout) {
      clearTimeout(maxWaitTimeout);
      maxWaitTimeout = null;
    }
    await performAutoSave();
  }, 5000);

  // MaxWait 30s
  if (!maxWaitTimeout) {
    maxWaitTimeout = setTimeout(async () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      maxWaitTimeout = null;
      await performAutoSave();
    }, 30000);
  }
}

export function initTabs(savedData = null) {
  const tabsContainer = document.getElementById('canvasTabsContainer');
  if (!tabsContainer) return;

  // Attempt to merge our tabs into the Dockview header using the React bridge
  const mergeInterval = setInterval(() => {
    const bridge = document.getElementById('canvasTabsReactBridge');
    if (bridge) {
      clearInterval(mergeInterval);

      // Inject our custom tabs container into the bridge
      bridge.appendChild(tabsContainer);

      tabsContainer.style.background = 'transparent';
      tabsContainer.style.borderBottom = 'none';
      tabsContainer.style.padding = '0';
      tabsContainer.style.height = '100%';
      tabsContainer.style.width = '100%';
    }
  }, 100);

  if (savedData && savedData.tabs && savedData.tabs.length > 0) {
    tabs = savedData.tabs;
    activeTabId = savedData.activeTabId || tabs[0].id;

    // Parse tab IDs to update tabCounter
    const maxId = Math.max(...tabs.map(t => parseInt(t.name.replace(/[^0-9]/g, '')) || 0));
    if (maxId && !isNaN(maxId)) tabCounter = maxId;

    // We do NOT reconstruct the offscreenData32 here for all tabs immediately because it requires pixelMap iteration
    // Instead we load the active tab completely
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    // Provide an empty imageData object for now, it will be recreated in loadTabState if null
    tabs.forEach(tab => {
      if (!tab.grid.imgData) {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = tab.grid.w;
        tmpCanvas.height = tab.grid.h;
        const tmpCtx = tmpCanvas.getContext('2d');
        tab.grid.imgData = tmpCtx.getImageData(0, 0, tab.grid.w, tab.grid.h);
        tab.grid.data32 = new Uint32Array(tab.grid.imgData.data.buffer);
      }
    });

    loadTabState(activeTab);
  } else if (tabs.length === 0) {
    // Create initial tab
    const initialTab = {
      id: generateId(),
      name: (t('tab.newCanvas') || 'New Canvas') + ' 1',
      pixelMap: pixelMap,
      groupMap: groupMap,
      history: getHistoryState(),
      grid: { w: GRID_WIDTH, h: GRID_HEIGHT, imgData: offscreenImageData, data32: offscreenData32 },
      bg: {
        src: els.imagePreview?.src || '',
        css: document.getElementById('pixelCanvas')?.style.getPropertyValue('--bg-url') || '',
        hasBg: document.getElementById('pixelCanvas')?.classList.contains('has-bg') || false
      },
      autoBackupDrive: false,
      storage: { type: null, id: null, handle: null, name: null },
      format: 'png',
      animation: null
    };

    tabs.push(initialTab);
    activeTabId = initialTab.id;
  }

  renderTabsUI();
  resizeCanvas();
  fitToScreen();
  renderPixels();
  debounceExtractCanvasColors();
}

export function saveCurrentTabState() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;

  tab.pixelMap = new Uint32Array(pixelMap);
  tab.groupMap = groupMap;
  tab.history = getHistoryState();
  tab.grid = { w: GRID_WIDTH, h: GRID_HEIGHT, imgData: offscreenImageData, data32: offscreenData32 };

  const canvas = document.getElementById('pixelCanvas');
  tab.bg = {
    src: els.imagePreview?.src || '',
    css: canvas?.style.getPropertyValue('--bg-url') || '',
    hasBg: canvas?.classList.contains('has-bg') || false
  };
  
  tab.animation = getAnimationState();
}

function loadTabState(tab) {
  setSourceImage(tab.bg.src || null);

  const canvas = document.getElementById('pixelCanvas');
  if (canvas) {
    if (tab.bg.hasBg) {
      canvas.classList.add('has-bg');
    } else {
      canvas.classList.remove('has-bg');
    }

    if (tab.bg.css) {
      canvas.style.setProperty('--bg-url', tab.bg.css);
    } else {
      canvas.style.removeProperty('--bg-url');
    }
  }
  
  if (tab.bg.src && tab.bg.hasBg) {
    setPreviewBackground(tab.bg.src);
  } else {
    removePreviewBackground();
  }
  
  updateBgButtonsUI();
  
  // Pipeline khôi phục: Nếu có Animation, giao quyền quản lý dữ liệu cho Animation
  if (tab.animation && tab.animation.isAnimationMode) {
    setGridSizeParams(tab.grid.w, tab.grid.h, tab.grid.imgData, tab.grid.data32);
    setAnimationState(tab.animation);
    loadFrameToCurrentState(tab.animation.activeFrameIndex || 0);
  } else {
    // Không có Animation, nạp dữ liệu lưới mặc định
    resetMaps(new Uint32Array(tab.pixelMap), tab.groupMap);
    setHistoryState(tab.history);
    setGridSizeParams(tab.grid.w, tab.grid.h, tab.grid.imgData, tab.grid.data32);
    setAnimationState(tab.animation || null);
  }
  syncGridSizeUI(tab.grid.w, tab.grid.h);
}

export function switchTab(id) {
  if (id === activeTabId) return;

  const targetTab = tabs.find(t => t.id === id);
  if (!targetTab) return;

  clearPendingSave();
  saveCurrentTabState();

  activeTabId = id;

  // Update UI immediately to prevent perceived delay
  if (targetTab.grid) {
    syncGridSizeUI(targetTab.grid.w, targetTab.grid.h);
  }

  const canvasWrap = document.querySelector('.canvas-wrap');
  if (canvasWrap) {
    canvasWrap.classList.add('fade-out');

    // Wait for fade out
    setTimeout(() => {
      loadTabState(targetTab);
      resizeCanvas();
      fitToScreen();
      renderPixels();
      renderTabsUI();

      // Remove fade out to trigger fade in
      canvasWrap.classList.remove('fade-out');
      debouncedSaveWorkspace();
      debounceExtractCanvasColors();
    }, 150); // Match CSS transition duration
  } else {
    loadTabState(targetTab);
    resizeCanvas();
    fitToScreen();
    renderPixels();
    renderTabsUI();
    debouncedSaveWorkspace();
    debounceExtractCanvasColors();
  }
}

export function createNewTab() {
  try {
    clearPendingSave();
    saveCurrentTabState();

    tabCounter++;
    const DEFAULT_SIZE = 32;
    const newId = generateId();
    const newTab = {
      id: newId,
      name: (t('tab.newCanvas') || 'New Canvas') + ' ' + tabCounter,
      pixelMap: new Uint32Array(DEFAULT_SIZE * DEFAULT_SIZE),
      groupMap: new Map(),
      history: { undoStack: [], redoStack: [], currentStroke: null },
      grid: { w: DEFAULT_SIZE, h: DEFAULT_SIZE, imgData: null, data32: null },
      bg: { src: '', css: '', hasBg: false },
      autoBackupDrive: false,
      storage: { type: null, id: null, handle: null, name: null },
      format: 'png',
      animation: null
    };

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = DEFAULT_SIZE;
    tmpCanvas.height = DEFAULT_SIZE;
    const tmpCtx = tmpCanvas.getContext('2d');
    newTab.grid.imgData = tmpCtx.getImageData(0, 0, DEFAULT_SIZE, DEFAULT_SIZE);
    newTab.grid.data32 = new Uint32Array(newTab.grid.imgData.data.buffer);

    tabs.push(newTab);
    activeTabId = newId;

    loadTabState(newTab);

    resizeCanvas();
    fitToScreen();
    renderPixels();
    renderTabsUI();
    debouncedSaveWorkspace();
    debounceExtractCanvasColors();
  } catch (err) {
    alert("Error creating tab: " + err.message + "\n" + err.stack);
  }
}

export function createTabFromData(name, w, h, data32) {
  try {
    saveCurrentTabState();
    tabCounter++;
    const newId = generateId();
    
    const newPixelMap = new Uint32Array(w * h);
    newPixelMap.set(data32);

    const newTab = {
      id: newId,
      name: name || ((t('tab.newCanvas') || 'New Canvas') + ' ' + tabCounter),
      pixelMap: newPixelMap,
      groupMap: new Map(),
      history: { undoStack: [], redoStack: [], currentStroke: null },
      grid: { w: w, h: h, imgData: null, data32: null },
      bg: { src: '', css: '', hasBg: false },
      autoBackupDrive: false,
      storage: { type: null, id: null, handle: null, name: null },
      format: 'png',
      animation: null
    };

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const tmpCtx = tmpCanvas.getContext('2d');
    const imgData = tmpCtx.createImageData(w, h);
    new Uint32Array(imgData.data.buffer).set(data32);
    tmpCtx.putImageData(imgData, 0, 0);
    
    newTab.grid.imgData = tmpCtx.getImageData(0, 0, w, h);
    newTab.grid.data32 = new Uint32Array(newTab.grid.imgData.data.buffer);

    tabs.push(newTab);
    activeTabId = newId;
    return newId;
  } catch (err) {
    console.error("Error createTabFromData", err);
  }
}

export function refreshUIAfterBatchImport() {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    loadTabState(currentTab);
    resizeCanvas();
    fitToScreen();
    renderPixels();
    renderTabsUI();
    debouncedSaveWorkspace();
    debounceExtractCanvasColors();
  }
}

export function closeTab(id) {
  if (tabs.length === 1) return;

  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;

  clearPendingSave();

  const tab = tabs[index];
  const hasModifications = tab.history && tab.history.undoStack && tab.history.undoStack.length > 0;
  if (hasModifications) {
    if (!window.confirm(t('confirm.closeTab') || 'Bạn có chắc muốn đóng tab này? Dữ liệu chưa lưu sẽ bị mất.')) {
      return;
    }
  }

  tabs.splice(index, 1);

  if (activeTabId === id) {
    const nextTab = tabs[Math.max(0, index - 1)];
    activeTabId = nextTab.id;
    loadTabState(nextTab);
    resizeCanvas();
    fitToScreen();
    renderPixels();
  }

  renderTabsUI();
  debouncedSaveWorkspace();
  debounceExtractCanvasColors();
}

export function renameTab(id, newName) {
  const tab = tabs.find(t => t.id === id);
  if (tab && newName.trim()) {
    tab.name = newName.trim();
    renderTabsUI();
    debouncedSaveWorkspace();
  }
}

function renderTabsUI() {
  const tabsContainer = document.getElementById('canvasTabsContainer');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';

  const tabList = document.createElement('div');
  tabList.className = 'tab-list';

  tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = `canvas-tab ${tab.id === activeTabId ? 'active' : ''}`;

    const nameEl = document.createElement('span');
    nameEl.className = 'tab-name';
    nameEl.textContent = tab.name;
    nameEl.title = t('tooltip.renameTab') || 'Click đúp để đổi tên';
    nameEl.addEventListener('dblclick', () => {
      const newName = window.prompt(t('prompt.renameTab') || 'Nhập tên mới cho tab:', tab.name);
      if (newName !== null) renameTab(tab.id, newName);
    });

    const toggleAutoBackupBtn = document.createElement('button');
    toggleAutoBackupBtn.id = 'autobackup_btn_' + tab.id;
    toggleAutoBackupBtn.className = `tab-autobackup-btn ${tab.autoBackupDrive ? 'active' : ''}`;
    toggleAutoBackupBtn.title = tab.autoBackupDrive ? 'Tắt tự động lưu lên Drive' : 'Bật tự động lưu lên Drive';
    toggleAutoBackupBtn.innerHTML = `<i data-lucide="${tab.autoBackupDrive ? 'cloud-check' : 'cloud-upload'}" style="width: 14px; height: 14px; color: ${tab.autoBackupDrive ? 'var(--color-success, #2ea043)' : 'var(--color-text-muted, #8b949e)'};"></i>`;
    toggleAutoBackupBtn.style.cssText = 'background: transparent; border: none; padding: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px;';
    toggleAutoBackupBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (!tab.autoBackupDrive && !getDriveToken()) {
        ensureDriveLogin(() => {
          tab.autoBackupDrive = true;
          renderTabsUI();
          debouncedSaveWorkspace();
        });
        return;
      }

      tab.autoBackupDrive = !tab.autoBackupDrive;
      renderTabsUI();
      if (tab.autoBackupDrive) debouncedSaveWorkspace();
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '<i data-lucide="x" style="width: 14px; height: 14px;"></i>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabEl.appendChild(nameEl);
    tabEl.appendChild(toggleAutoBackupBtn);
    if (tabs.length > 1) {
      tabEl.appendChild(closeBtn);
    }

    tabEl.addEventListener('click', () => switchTab(tab.id));

    tabList.appendChild(tabEl);
  });

  const newTabBtn = document.createElement('button');
  newTabBtn.className = 'new-tab-btn';
  newTabBtn.innerHTML = '<i data-lucide="plus" style="width: 16px; height: 16px;"></i>';
  newTabBtn.title = t('tooltip.newCanvas') || 'New Canvas';
  newTabBtn.addEventListener('click', createNewTab);

  tabsContainer.appendChild(tabList);
  tabsContainer.appendChild(newTabBtn);

  if (window.lucide) window.lucide.createIcons({ root: tabsContainer });
}
