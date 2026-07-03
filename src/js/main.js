import { resizeCanvas, fitToScreen } from './core/viewport.js';
import { renderPixels } from './core/render.js';
import { els, setStatus, setCurrentTool, initEls } from './core/state.js';
import { getTabs, getActiveTabId } from './core/tab-manager.js';

import { setupGradientMode } from './modes/gradient-mode.js';
import { setupMirrorMode } from './modes/mirror-mode.js';
import { setupShowGrid } from './modes/show-grid.js';

import { setupUndo, setupRedo } from './actions/undo-redo.js';
import { setupZoomActions } from './actions/zoom.js';
import { setupSwapColors } from './actions/swap-colors.js';
import { setupSetBackground } from './actions/set-background.js';
import { setupTrim } from './actions/trim.js';
import { setupGridSizeSelect, setGridSize } from './actions/grid-size-select.js';
import { setupToggleToolsPanel } from './actions/toggle-tools-panel.js';
import { initTabs } from './core/tab-manager.js';
import { loadWorkspace } from './core/storage.js';

import { setupRotate } from './transforms/rotate.js';
import { setupFlipH } from './transforms/flip-h.js';
import { setupFlipV } from './transforms/flip-v.js';

import { setupUploadModal } from './io/upload/upload-modal.js';
import { exportPng } from './io/export/export-png.js';
import { exportJpeg } from './io/export/export-jpeg.js';
import { exportWebp } from './io/export/export-webp.js';
import { exportJson } from './io/export/export-json.js';
import { exportToDrive, showNotification } from './services/drive-ui.js';

import { initCustomTooltip } from './ui/tooltip.js';
import { initMobilePopups } from './ui/mobile-popups.js';
import { initFloatingNav } from './ui/floating-nav.js';

import { setupCanvasEvents } from './canvas-events.js';
import { updateDOM, toggleLang, t } from './lang/i18n.js';

let initialized = false;

export function initEditor() {
  if (initialized) return;
  initialized = true;

  initEls();

  if (window.lucide) window.lucide.createIcons();

  // Initialize Canvas
  resizeCanvas();
  fitToScreen();
  renderPixels();

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

  const downloadModal = document.getElementById('downloadModal');
  const openDownloadModalBtn = document.getElementById('openDownloadModalBtn');
  const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');

  if (openDownloadModalBtn && downloadModal) {
    openDownloadModalBtn.addEventListener('click', () => {
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
            if (format === 'png') exportPng(tab);
            else if (format === 'jpeg') exportJpeg(tab);
            else if (format === 'webp') exportWebp(tab);
            else if (format === 'json') exportJson(tab);
            successCount++;
          } else if (dest === 'drive') {
            await exportToDrive(tab, format);
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

  setStatus(t('status.init'));
}

window.addEventListener('toolbar-mounted', () => {
  initEls();
  setupSwapColors();
  
  const saveToolbarState = () => {
    const state = {
      color1: els.colorPicker?.value,
      color2: els.colorPicker2?.value,
      pencilSize: document.getElementById('pencilSize')?.value,
      eraserSize: document.getElementById('eraserSize')?.value,
      outlineThickness: document.getElementById('outlineThickness')?.value,
      shapeThickness: document.querySelector('.shape-thickness')?.value,
      currentTool: document.querySelector('.tool-btn.active')?.dataset?.tool || 'pencil'
    };
    localStorage.setItem('pixel_toolbar_state', JSON.stringify(state));
  };

  const loadToolbarState = () => {
    try {
      const state = JSON.parse(localStorage.getItem('pixel_toolbar_state') || '{}');
      if (state.color1 && els.colorPicker) els.colorPicker.value = state.color1;
      if (state.color2 && els.colorPicker2) els.colorPicker2.value = state.color2;
      if (state.pencilSize) {
        const p = document.getElementById('pencilSize');
        if (p) p.value = state.pencilSize;
      }
      if (state.eraserSize) {
        const e = document.getElementById('eraserSize');
        if (e) e.value = state.eraserSize;
      }
      if (state.outlineThickness) {
        const o = document.getElementById('outlineThickness');
        if (o) o.value = state.outlineThickness;
      }
      if (state.shapeThickness) {
        document.querySelectorAll('.shape-thickness').forEach(el => el.value = state.shapeThickness);
      }
      if (state.currentTool) {
        const btn = document.querySelector(`.tool-btn[data-tool="${state.currentTool}"]`);
        if (btn) btn.click();
      }
    } catch(e) {}
  };

  loadToolbarState();

  if (els.toolBtns) {
    els.toolBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        els.toolBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        setCurrentTool(btn.dataset.tool);
        setStatus(`${t("status.toolSelected")} ${btn.getAttribute("data-tooltip") || btn.title}`);
        saveToolbarState();
      });
    });
  }

  const shapeThicknessInputs = document.querySelectorAll(".shape-thickness");
  shapeThicknessInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      shapeThicknessInputs.forEach(other => other.value = e.target.value);
      saveToolbarState();
    });
  });

  ['colorPicker', 'colorPicker2', 'pencilSize', 'eraserSize', 'outlineThickness'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', saveToolbarState);
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
  
  setupCanvasEvents();
  setupZoomActions();
  initFloatingNav();
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
