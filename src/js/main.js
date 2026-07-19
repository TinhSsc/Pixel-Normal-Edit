import { initMainCanvasLayout, bindMainCanvasEvents } from './core/main-canvas-manager.js';
import { els, setStatus, setCurrentTool, initEls } from './core/state.js';
import { getTabs, getActiveTabId, initTabs, performQuickSave, syncToDrive } from './core/tab-manager.js';

import { setupGradientMode } from './modes/gradient-mode.js';
import { setupMirrorMode } from './modes/mirror-mode.js';
import { setupShowGrid } from './modes/show-grid.js';

import { setupUndo, setupRedo } from './actions/undo-redo.js';
import { setupSwapColors } from './actions/swap-colors.js';
import { setupSetBackground } from './actions/set-background.js';
import { setupTrim } from './actions/trim.js';
import { setupGridSizeSelect, setGridSize } from './actions/grid-size-select.js';
import { setupToggleToolsPanel } from './actions/toggle-tools-panel.js';
import { handleCopy, handleCut, handlePaste, handleDeleteSelection } from './actions/clipboard.js';
import { loadWorkspace } from './core/storage.js';

import { setupRotate } from './transforms/rotate.js';
import { setupFlipH } from './transforms/flip-h.js';
import { setupFlipV } from './transforms/flip-v.js';

import { setupUploadModal } from './io/upload/upload-modal.js';
import { exportJpeg, generateWorkspaceJpegBlob } from './io/export/export-jpeg.js';
import { exportJson, generateWorkspaceJsonBlob } from './io/export/export-json.js';
import { exportPng, generateWorkspacePngBlob } from './io/export/export-png.js';
import { exportWebp, generateWorkspaceWebpBlob } from './io/export/export-webp.js';
import { generateSpriteSheetBlob, generateZipBlob, exportSpriteSheet, exportZip } from './io/export/export-animation.js';
import { getCurrentDirectoryHandle, saveFileToLocalDrive, initLocalDrive } from './services/local-drive.js';
import { exportToDrive, showNotification } from './services/drive-ui.js';

import { initCustomTooltip } from './ui/tooltip.js';
import { initMobilePopups } from './ui/mobile-popups.js';
import { initToolPopup } from './tool-popup/index.js';
import { updateDOM, toggleLang, t } from './lang/i18n.js';

import { saveToolbarState } from './core/toolbar-save.js';
import { loadAndResetToolbarState } from './core/toolbar-reset.js';

let initialized = false;

export function initEditor() {
  if (initialized) return;
  initialized = true;

  initEls();

  if (window.lucide) window.lucide.createIcons();

  // Initialize Canvas
  initMainCanvasLayout();

  // Setup Modes
  setupGradientMode();
  setupMirrorMode();
  setupShowGrid();

  // Initialize Language
  updateDOM();
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      toggleLang();
    }
  });

  // Initial setup for things that never unmount (Header, Modals)
  setupUndo();
  setupRedo();
  setupToggleToolsPanel();
  setupUploadModal();

  const quickSaveBtn = document.getElementById('quickSaveBtn');
  if (quickSaveBtn) {
    quickSaveBtn.addEventListener('click', () => {
      performQuickSave();
    });
  }

  // Hotkeys
  document.addEventListener('keydown', (e) => {
    // Avoid triggering canvas hotkeys when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      performQuickSave();
    }
    // Ctrl+C
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handleCopy();
    }
    // Ctrl+X
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      handleCut();
    }
    // Ctrl+V
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      handlePaste();
    }
    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDeleteSelection();
    }
  });

  const downloadModal = document.getElementById('downloadModal');
  const openDownloadModalBtn = document.getElementById('openDownloadModalBtn');
  const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');

  if (openDownloadModalBtn && downloadModal) {
    openDownloadModalBtn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
      downloadModal.style.display = 'flex';
      
      const canvasList = document.getElementById('downloadCanvasList');
      if (canvasList) {
        canvasList.innerHTML = '';
        const tabs = getTabs();
        const activeTabId = getActiveTabId();
        
        tabs.forEach(tab => {
          const label = document.createElement('label');
          label.className = 'canvas-checkbox-item';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = tab.id;
          if (tab.id === activeTabId) {
            checkbox.checked = true;
          }
          
          const span = document.createElement('span');
          span.textContent = tab.name;
          
          label.appendChild(checkbox);
          label.appendChild(span);
          canvasList.appendChild(label);
        });
      }
    });
  }

  if (closeDownloadModalBtn && downloadModal) {
    closeDownloadModalBtn.addEventListener('click', () => {
      downloadModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside of modal-content
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) {
        downloadModal.style.display = 'none';
      }
    });
  }

  // Handle format and destination selection (Radio-button behavior)
  const formatBtns = document.querySelectorAll('.dl-format-btn');
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const destBtns = document.querySelectorAll('.dl-dest-btn');
  destBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      destBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Handle Execute Download Button
  const executeDownloadBtn = document.getElementById('executeDownloadBtn');
  if (executeDownloadBtn) {
    executeDownloadBtn.addEventListener('click', async () => {
      const selectedCheckboxes = document.querySelectorAll('#downloadCanvasList input[type="checkbox"]:checked');
      if (selectedCheckboxes.length === 0) {
        showNotification('Vui lòng chọn ít nhất 1 canvas để tải!', true);
        return;
      }

      const activeFormatBtn = document.querySelector('.dl-format-btn.active');
      const format = activeFormatBtn ? activeFormatBtn.dataset.format : 'png';
      
      const activeDestBtn = document.querySelector('.dl-dest-btn.active');
      const dest = activeDestBtn ? activeDestBtn.dataset.dest : 'local';

      const tabs = getTabs();
      let successCount = 0;

      // Update button state
      const originalHtml = executeDownloadBtn.innerHTML;
      executeDownloadBtn.disabled = true;
      executeDownloadBtn.innerHTML = '<i data-lucide="loader-2" style="width:18px;height:18px;margin-right:6px"></i> Đang xử lý...';
      if (window.lucide) window.lucide.createIcons();

      try {
        for (const cb of selectedCheckboxes) {
          const tab = tabs.find(t => t.id === cb.value);
          if (!tab) continue;

          if (dest === 'local') {
            const handle = getCurrentDirectoryHandle();
            if (handle) {
              const namePrefix = tab.name.replace(/\s+/g, '-');
              try {
                if (format === 'png') {
                  await saveFileToLocalDrive(`${namePrefix}.png`, await generateWorkspacePngBlob(tab));
                } else if (format === 'jpeg') {
                  await saveFileToLocalDrive(`${namePrefix}.jpg`, await generateWorkspaceJpegBlob(tab));
                } else if (format === 'webp') {
                  await saveFileToLocalDrive(`${namePrefix}.webp`, await generateWorkspaceWebpBlob(tab));
                } else if (format === 'json') {
                  await saveFileToLocalDrive(`${namePrefix}.json`, generateWorkspaceJsonBlob(tab));
                } else if (format === 'spritesheet') {
                  await saveFileToLocalDrive(`${namePrefix}-spritesheet.png`, await generateSpriteSheetBlob(tab));
                } else if (format === 'zip') {
                  await saveFileToLocalDrive(`${namePrefix}.zip`, await generateZipBlob(tab));
                }
                // Save As thành công: Cập nhật storage sang Local
                const extension = format === 'jpeg' ? 'jpg' : (format === 'spritesheet' ? 'png' : format);
                tab.storage = { type: 'local', id: null, handle: null, name: `${namePrefix}.${extension}` };
                tab.format = format;
              } catch (saveErr) {
                console.warn('Local drive save failed, falling back to download', saveErr);
                if (format === 'png') exportPng(tab);
                else if (format === 'jpeg') exportJpeg(tab);
                else if (format === 'webp') exportWebp(tab);
                else if (format === 'json') exportJson(tab);
                else if (format === 'spritesheet') exportSpriteSheet(tab);
                else if (format === 'zip') exportZip(tab);
              }
            } else {
              if (format === 'png') exportPng(tab);
              else if (format === 'jpeg') exportJpeg(tab);
              else if (format === 'webp') exportWebp(tab);
              else if (format === 'json') exportJson(tab);
              else if (format === 'spritesheet') exportSpriteSheet(tab);
              else if (format === 'zip') exportZip(tab);
            }
            successCount++;
          } else if (dest === 'drive') {
            const fileId = tab.storage && tab.storage.type === 'drive' ? tab.storage.id : null;
            // The exportToDrive function in drive-ui.js doesn't update tab.storage yet.
            // Wait, exportToDrive doesn't return the new file ID directly to us here.
            // Let's call it and assume the tab format needs to be updated.
            // We already imported syncToDrive from tab-manager statically
            tab.format = format; // temporarily set format
            await syncToDrive(tab);
            successCount++;
          }
        }
        
        showNotification(`Đã tải thành công ${successCount} tệp!`);
        downloadModal.style.display = 'none';
      } catch (err) {
        showNotification(err.message, true);
      } finally {
        executeDownloadBtn.disabled = false;
        executeDownloadBtn.innerHTML = originalHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  initCustomTooltip();
  initMobilePopups(); // Global document click handler inside

  initLocalDrive().catch(console.error);
  
  setStatus(t('status.init'));
}

window.addEventListener('toolbar-mounted', () => {
  initEls();
  setupSwapColors();
  
  // Đã chuyển logic sang toolbar-save.js và toolbar-reset.js
  loadAndResetToolbarState();

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.tool-btn[data-tool]');
    if (btn) {
      const toolId = btn.dataset.tool;
      if (['cut', 'copy', 'paste'].includes(toolId)) {
        if (toolId === 'cut') handleCut();
        if (toolId === 'copy') handleCopy();
        if (toolId === 'paste') handlePaste();
        // Do not make these active tools
        return;
      }
      
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCurrentTool(toolId);
      setStatus(`${t("status.toolSelected")} ${btn.getAttribute("data-tooltip") || btn.title}`);
      saveToolbarState();
    }
  });

  window.addEventListener('tool-changed', () => {
    saveToolbarState();
  });

  document.body.addEventListener('input', (e) => {
    if (e.target.classList.contains('shape-thickness')) {
      document.querySelectorAll('.shape-thickness').forEach(other => other.value = e.target.value);
      saveToolbarState();
    }
  });

  document.body.addEventListener('change', (e) => {
    const ids = ['colorPicker', 'colorPicker2', 'pixelPenSize', 'highlightPenSize', 'blendBrushSize', 'eraserSize', 'outlineThickness', 'globalPenShape', 'sprayPenSize', 'sprayPenDensity', 'replaceTolerance'];
    if (ids.includes(e.target.id)) {
      saveToolbarState();
    }
  });

  // Re-run mobile popups for toolbar items
  document.querySelectorAll('.toolbar .tool-with-popup, .toolbar .tool-with-popup-left, .toolbar .tool-with-popup-bottom').forEach(wrapper => {
    if (wrapper.querySelector('.mobile-popup-trigger')) return;
    const trigger = document.createElement('button');
    trigger.className = 'mobile-popup-trigger';
    trigger.textContent = '…';
    wrapper.appendChild(trigger);
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('show-popup');
      document.querySelectorAll('.show-popup').forEach(w => w.classList.remove('show-popup'));
      if (!isOpen) wrapper.classList.add('show-popup');
    });
  });

  initToolPopup();
});

window.addEventListener('canvas-mounted', async () => {
  initEls();
  
  setupTrim();
  setupGridSizeSelect();

  const savedData = await loadWorkspace();

  if (!savedData || !savedData.tabs || savedData.tabs.length === 0) {
    setGridSize(32, 32);
  }
  
  initTabs(savedData);
  
  bindMainCanvasEvents();
});

window.addEventListener('settings-mounted', () => {
  initEls();
  setupGradientMode();
  setupMirrorMode();
  setupShowGrid();
  setupRotate();
  setupFlipH();
  setupFlipV();
  setupSetBackground();

  // Re-run mobile popups for settings items
  document.querySelectorAll('.right-panel .tool-with-popup, .right-panel .tool-with-popup-left, .right-panel .tool-with-popup-bottom').forEach(wrapper => {
    if (wrapper.querySelector('.mobile-popup-trigger')) return;
    const trigger = document.createElement('button');
    trigger.className = 'mobile-popup-trigger';
    trigger.textContent = '…';
    wrapper.appendChild(trigger);
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('show-popup');
      document.querySelectorAll('.show-popup').forEach(w => w.classList.remove('show-popup'));
      if (!isOpen) wrapper.classList.add('show-popup');
    });
  });
});
