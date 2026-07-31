import { initMainCanvasLayout, bindMainCanvasEvents } from './core/main-canvas-manager.js';
import { els, setStatus, setCurrentTool, initEls, pixelMap } from './core/state.js';
import { getTabs, getActiveTabId, initTabs, performQuickSave, syncToDrive, debouncedSaveWorkspace } from './core/tab-manager.js';
import { isAnimationMode } from './core/animation-state.js';

import { setupGradientMode } from './modes/gradient-mode.js';
import { setupMirrorMode } from './modes/mirror-mode.js';
import { setupShowGrid } from './modes/show-grid.js';

import { setupUndo, setupRedo } from './actions/undo-redo.js';
import { undo, redo } from './core/history.js';
import { renderPixels } from './core/render.js';
import { zoomIn, zoomOut, fitToScreen } from './core/viewport.js';
import { handleSelectUndo } from './tools/select.js';
import { setupSwapColors } from './actions/swap-colors.js';
import { setupSetBackground } from './actions/set-background.js';
import { setupTrim } from './actions/trim.js';
import { setupGridSizeSelect, setGridSize } from './actions/grid-size-select.js';
import { setupToggleToolsPanel } from './actions/toggle-tools-panel.js';
import { handleCopy, handleCut, handlePaste, handleDeleteSelection } from './actions/clipboard.js';
import { loadWorkspace } from './core/storage.js';
import { initKeyboardShortcuts } from './actions/keyboard-shortcuts.js';

import { setupRotate } from './transforms/rotate.js';
import { setupFlipH } from './transforms/flip-h.js';
import { setupFlipV } from './transforms/flip-v.js';

import { setupUploadModal } from '../io/upload/upload-modal.js';
import { exportJpeg, generateWorkspaceJpegBlob } from '../io/export/export-jpeg.js';
import { exportJson, generateWorkspaceJsonBlob } from '../io/export/export-json.js';
import { exportPng, generateWorkspacePngBlob } from '../io/export/export-png.js';
import { exportWebp, generateWorkspaceWebpBlob } from '../io/export/export-webp.js';
import { generateSpriteSheetBlob, generateZipBlob, exportSpriteSheet, exportZip } from '../io/export/export-animation.js';
import { getCurrentDirectoryHandle, saveFileToLocalDrive, initLocalDrive } from '../../storage/local/local-drive.js';
import { exportToDrive, showNotification } from '../../storage/cloud/drive-ui.js';

import { initCustomTooltip } from '../dom-adapter/tooltip.js';
import { initMobilePopups } from '../dom-adapter/mobile-popups.js';
import { initToolPopup } from '../ui/tool-popup/index.js';
import { updateDOM, toggleLang, t } from '../../../i18n/i18n.js';
import { reloadLucideIcons, lucideIconHtml } from '../../../shared/dom/lucide-utils';
import { initMobilePopupTriggers } from '../../../shared/dom/popup-controller';

import { saveToolbarState } from './core/toolbar-save.js';
import { loadAndResetToolbarState } from './core/toolbar-reset.js';
import { initEditorAPI } from '../api/editor-api.js';

let initialized = false;

export function initEditor() {
  if (initialized) return;
  initialized = true;

  initEditorAPI();
  initEls();

  reloadLucideIcons();
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

  // Hotkeys – managed by centralized keyboard-shortcuts.js
  initKeyboardShortcuts();


  const downloadModal = document.getElementById('downloadModal');
  const openDownloadModalBtn = document.getElementById('openDownloadModalBtn');
  const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');
  const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');

  if (openDownloadModalBtn && downloadModal) {
    openDownloadModalBtn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
      downloadModal.style.display = 'flex';
      
      const canvasList = document.getElementById('downloadCanvasList');
      if (canvasList) {
        canvasList.innerHTML = '';
        const tabs = getTabs();
        const activeTabId = getActiveTabId();
        const activeTab = tabs.find(t => t.id === activeTabId);

        // Auto switch Export Type Tab based on current canvas animation mode
        const isAnim = isAnimationMode === true;
        const staticTabBtn = document.querySelector('.export-type-btn[data-type="static"]');
        const animTabBtn = document.querySelector('.export-type-btn[data-type="animation"]');
        const staticFormats = document.getElementById('staticFormats');
        const animFormats = document.getElementById('animFormats');

        if (isAnim) {
          animTabBtn?.classList.add('active');
          staticTabBtn?.classList.remove('active');
          if (staticFormats) staticFormats.style.display = 'none';
          if (animFormats) animFormats.style.display = 'flex';
          
          document.querySelectorAll('#animFormats .dl-format-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('#animFormats .dl-format-btn[data-format="spritesheet"]')?.classList.add('active');
        } else {
          staticTabBtn?.classList.add('active');
          animTabBtn?.classList.remove('active');
          if (animFormats) animFormats.style.display = 'none';
          if (staticFormats) staticFormats.style.display = 'flex';
          
          document.querySelectorAll('#staticFormats .dl-format-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('#staticFormats .dl-format-btn[data-format="png"]')?.classList.add('active');
        }

        if (tabs.length > 1) {
          const selectAllLabel = document.createElement('label');
          selectAllLabel.className = 'asset-select-item select-all';
          selectAllLabel.style.marginBottom = '8px';
          
          const selectAllCheckbox = document.createElement('input');
          selectAllCheckbox.type = 'checkbox';
          selectAllCheckbox.id = 'selectAllTabs';
          
          const selectAllSpan = document.createElement('span');
          selectAllSpan.setAttribute('data-i18n', 'download.selectAll');
          selectAllSpan.textContent = t('download.selectAll') || 'Chọn tất cả (All Tabs)';
          
          selectAllLabel.appendChild(selectAllCheckbox);
          selectAllLabel.appendChild(selectAllSpan);
          canvasList.appendChild(selectAllLabel);

          selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (isChecked) {
              selectAllLabel.classList.add('active');
            } else {
              selectAllLabel.classList.remove('active');
            }
            canvasList.querySelectorAll('.tab-checkbox').forEach(cb => {
              cb.checked = isChecked;
              const itemLabel = cb.closest('.asset-select-item');
              if (itemLabel) {
                if (isChecked) itemLabel.classList.add('active');
                else itemLabel.classList.remove('active');
              }
            });
          });
        }

        tabs.forEach(tab => {
          const label = document.createElement('label');
          label.className = 'asset-select-item';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'tab-checkbox check';
          checkbox.value = tab.id;
          
          if (tab.id === activeTabId) {
            checkbox.checked = true;
            label.classList.add('active');
          }
          
          checkbox.addEventListener('change', (e) => {
             const isChecked = e.target.checked;
             if (isChecked) {
               label.classList.add('active');
             } else {
               label.classList.remove('active');
             }
             const allTabsCb = document.getElementById('selectAllTabs');
             if (allTabsCb) {
                 const allChecked = Array.from(canvasList.querySelectorAll('.tab-checkbox')).every(cb => cb.checked);
                 allTabsCb.checked = allChecked;
                 const selectAllLabel = allTabsCb.closest('.asset-select-item');
                 if (selectAllLabel) {
                   if (allChecked) selectAllLabel.classList.add('active');
                   else selectAllLabel.classList.remove('active');
                 }
             }
          });
          
          const span = document.createElement('span');
          span.textContent = tab.name;
          
          label.appendChild(checkbox);
          label.appendChild(span);
          canvasList.appendChild(label);
        });
      }
    });
  }

  const closeDownloadModal = () => {
    if (downloadModal) downloadModal.style.display = 'none';
  };

  if (closeDownloadModalBtn) closeDownloadModalBtn.addEventListener('click', closeDownloadModal);
  if (cancelDownloadBtn) cancelDownloadBtn.addEventListener('click', closeDownloadModal);

  // Close modal when clicking outside of modal-content
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) closeDownloadModal();
    });
  }

  // Handle Type switch
  const typeBtns = document.querySelectorAll('.export-type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const staticFormats = document.getElementById('staticFormats');
      const animFormats = document.getElementById('animFormats');
      
      typeBtns.forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      if (btn.dataset.type === 'static') {
        if (staticFormats) staticFormats.style.display = 'flex';
        if (animFormats) animFormats.style.display = 'none';
        document.querySelectorAll('#staticFormats .dl-format-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#staticFormats .dl-format-btn[data-format="png"]')?.classList.add('active');
      } else {
        if (staticFormats) staticFormats.style.display = 'none';
        if (animFormats) animFormats.style.display = 'flex';
        document.querySelectorAll('#animFormats .dl-format-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#animFormats .dl-format-btn[data-format="spritesheet"]')?.classList.add('active');
      }
    });
  });

  // Handle format and destination selection
  const formatBtns = document.querySelectorAll('.dl-format-btn');
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.format-selector');
      if (parent) parent.querySelectorAll('.dl-format-btn').forEach(b => b.classList.remove('active'));
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
        showNotification(t('download.noCanvasSelected'), true);
        return;
      }

      const typeBtn = document.querySelector('.export-type-btn.active');
      const isStatic = typeBtn ? typeBtn.dataset.type === 'static' : true;
      const activeFormatBtn = document.querySelector(isStatic ? '#staticFormats .dl-format-btn.active' : '#animFormats .dl-format-btn.active');
      const format = activeFormatBtn ? activeFormatBtn.dataset.format : 'png';
      
      const activeDestBtn = document.querySelector('.dl-dest-btn.active');
      const dest = activeDestBtn ? activeDestBtn.dataset.dest : 'local';
      
      const dlTransparentBg = document.getElementById('dlTransparentBg');
      const isTransparent = dlTransparentBg ? dlTransparentBg.checked : true;
      const exportOptions = { transparent: isTransparent };

      const tabs = getTabs();
      let successCount = 0;

      const originalHtml = executeDownloadBtn.innerHTML;
      executeDownloadBtn.disabled = true;
      executeDownloadBtn.innerHTML = `<span style="display:flex;align-items:center;gap:6px;">${lucideIconHtml('loader-2', { className: 'anim-spin', width: 18, height: 18 })} Đang xử lý...</span>`;
      reloadLucideIcons();

      try {
        for (const cb of selectedCheckboxes) {
          const tab = tabs.find(t => t.id === cb.value);
          if (!tab) continue;

          if (dest === 'local') {
            const handle = getCurrentDirectoryHandle();
            const namePrefix = tab.name.replace(/\s+/g, '-');
            
            const runExport = async () => {
               if (format === 'png') return generateWorkspacePngBlob(tab, exportOptions);
               if (format === 'jpeg') return generateWorkspaceJpegBlob(tab, exportOptions);
               if (format === 'webp') return generateWorkspaceWebpBlob(tab, exportOptions);
               if (format === 'json') return generateWorkspaceJsonBlob(tab);
               if (format === 'spritesheet') return generateSpriteSheetBlob(tab, exportOptions);
               if (format === 'zip') return generateZipBlob(tab, exportOptions);
               if (format === 'webm' || format === 'gif') {
                  const animExport = await import('../io/export/export-animation.js');
                  return animExport.exportAnimation(tab, format, exportOptions);
               }
            };
            
            if (handle) {
              try {
                const blob = await runExport();
                let ext = format;
                if (format === 'jpeg') ext = 'jpg';
                if (format === 'spritesheet') ext = 'png';
                await saveFileToLocalDrive(`${namePrefix}.${ext}`, blob);
                
                tab.storage = { type: 'local', id: null, handle: null, name: `${namePrefix}.${ext}` };
                tab.format = format;
              } catch (saveErr) {
                console.warn('Local drive save failed, falling back to download', saveErr);
                const blob = await runExport();
                let ext = format;
                if (format === 'jpeg') ext = 'jpg';
                if (format === 'spritesheet') ext = 'png';
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${namePrefix}.${ext}`;
                a.click();
              }
            } else {
               const blob = await runExport();
               let ext = format;
               if (format === 'jpeg') ext = 'jpg';
               if (format === 'spritesheet') ext = 'png';
               const a = document.createElement('a');
               a.href = URL.createObjectURL(blob);
               a.download = `${namePrefix}.${ext}`;
               a.click();
            }
            successCount++;
          } else if (dest === 'drive') {
            tab.format = format; 
            await syncToDrive(tab);
            successCount++;
          }
        }
        
        if (dest === 'drive') {
          showNotification(t('status.savedToDrive') || 'Đã lưu vào Google Drive');
        } else {
          const handle = getCurrentDirectoryHandle();
          if (handle) {
            showNotification(t('status.savedToLocal') || 'Đã lưu vào Thư mục cục bộ');
          } else {
            showNotification(t('download.success', successCount));
          }
        }
        closeDownloadModal();
      } catch (err) {
        showNotification(err.message, true);
      } finally {
        executeDownloadBtn.disabled = false;
        executeDownloadBtn.innerHTML = originalHtml;
        reloadLucideIcons();
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

    // Event delegation for zoom buttons (may be dynamically added by React)
    const zoomBtn = e.target.closest('#zoomInBtn, #zoomOutBtn, #zoomResetBtn');
    if (zoomBtn) {
      const id = zoomBtn.id;
      if (id === 'zoomInBtn') {
        zoomIn();
        setStatus(`${t('status.zoom')} In`);
      } else if (id === 'zoomOutBtn') {
        zoomOut();
        setStatus(`${t('status.zoom')} Out`);
      } else if (id === 'zoomResetBtn') {
        fitToScreen();
        setStatus(t('status.zoomFit'));
      }
      return;
    }

    // Event delegation for undo/redo buttons (may be dynamically added by React)
    const undoBtn = e.target.closest('.undo-btn-action');
    if (undoBtn) {
      if (handleSelectUndo()) return;
      const did = undo(pixelMap, renderPixels);
      if (did) {
        setStatus(t('status.undo'));
        debouncedSaveWorkspace();
      }
      return;
    }

    const redoBtn = e.target.closest('.redo-btn-action');
    if (redoBtn) {
      const did = redo(pixelMap, renderPixels);
      if (did) {
        setStatus(t('status.redo'));
        debouncedSaveWorkspace();
      }
      return;
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
    const ids = ['colorPicker', 'colorPicker2', 'pixelPenSize', 'highlightPenSize', 'blendBrushSize', 'ditherBrushSize', 'softBrushSize', 'eraserSize', 'outlineThickness', 'globalPenShape', 'sprayPenSize', 'sprayPenDensity', 'replaceTolerance'];
    if (ids.includes(e.target.id)) {
      saveToolbarState();
    }
  });

  // Sử dụng shared module popup-controller
  initMobilePopupTriggers('.toolbar');
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

  // Sử dụng shared module popup-controller
  initMobilePopupTriggers('.right-panel');
});
