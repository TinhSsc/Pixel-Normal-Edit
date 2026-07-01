import { pixelMap, groupMap, GRID_WIDTH, GRID_HEIGHT, offscreenImageData, offscreenData32, setGridSizeParams, resetMaps, els } from './state.js';
import { getHistoryState, setHistoryState } from './history.js';
import { renderPixels } from './render.js';
import { resizeCanvas, fitToScreen } from './viewport.js';
import { t } from '../lang/i18n.js';
import { syncGridSizeUI } from '../actions/grid-size-select.js';
import { setSourceImage } from '../actions/set-background.js';
import { saveWorkspace } from './storage.js';
import { generateWorkspacePngBlob } from '../io/export/export-png.js';
import { uploadToDrive, getDriveToken } from '../services/drive-api.js';

let tabs = [];
let activeTabId = null;
let tabCounter = 1;

export function getTabs() { return tabs; }
export function getActiveTabId() { return activeTabId; }

function generateId() {
  return 'tab_' + Math.random().toString(36).substr(2, 9);
}

let saveTimeout = null;
export function clearPendingSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
}

export function debouncedSaveWorkspace() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    saveCurrentTabState();
    saveWorkspace(tabs, activeTabId);
    
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.autoBackupDrive && getDriveToken()) {
      try {
        const blob = await generateWorkspacePngBlob(currentTab);
        const fileName = `${currentTab.name || 'pixel-art'}.png`;
        const fileId = await uploadToDrive(fileName, blob, currentTab.driveFileId);
        if (!currentTab.driveFileId) currentTab.driveFileId = fileId;
      } catch (err) {
        console.error("Auto backup failed:", err);
      }
    }
  }, 500);
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
      driveFileId: null
    };
    
    tabs.push(initialTab);
    activeTabId = initialTab.id;
  }
  
  renderTabsUI();
  resizeCanvas();
  fitToScreen();
  renderPixels();
}

function saveCurrentTabState() {
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
}

function loadTabState(tab) {
  resetMaps(new Uint32Array(tab.pixelMap), tab.groupMap);
  setHistoryState(tab.history);
  setGridSizeParams(tab.grid.w, tab.grid.h, tab.grid.imgData, tab.grid.data32);
  syncGridSizeUI(tab.grid.w, tab.grid.h);
  
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
}

export function switchTab(id) {
  if (id === activeTabId) return;
  
  const targetTab = tabs.find(t => t.id === id);
  if (!targetTab) return;
  
  clearPendingSave();
  saveCurrentTabState();
  
  activeTabId = id;
  
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
    }, 150); // Match CSS transition duration
  } else {
    loadTabState(targetTab);
    resizeCanvas();
    fitToScreen();
    renderPixels();
    renderTabsUI();
    debouncedSaveWorkspace();
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
    bg: { src: '', css: '' },
    autoBackupDrive: false,
    driveFileId: null
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
  } catch (err) {
    alert("Error creating tab: " + err.message + "\n" + err.stack);
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
    toggleAutoBackupBtn.className = `tab-autobackup-btn ${tab.autoBackupDrive ? 'active' : ''}`;
    toggleAutoBackupBtn.title = tab.autoBackupDrive ? 'Tắt tự động lưu lên Drive' : 'Bật tự động lưu lên Drive';
    toggleAutoBackupBtn.innerHTML = `<i data-lucide="${tab.autoBackupDrive ? 'check-circle-2' : 'cloud'}" style="width: 14px; height: 14px; color: ${tab.autoBackupDrive ? 'var(--color-success)' : 'var(--color-text-muted)'};"></i>`;
    toggleAutoBackupBtn.style.cssText = 'background: transparent; border: none; padding: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px;';
    toggleAutoBackupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
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
