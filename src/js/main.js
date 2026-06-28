import { resizeCanvas, fitToScreen } from './core/viewport.js';
import { renderPixels } from './core/render.js';
import { els, setStatus, setCurrentTool, initEls } from './core/state.js';

import { setupGradientMode } from './modes/gradient-mode.js';
import { setupMirrorMode } from './modes/mirror-mode.js';
import { setupShowGrid } from './modes/show-grid.js';

import { setupUndo, setupRedo } from './actions/undo-redo.js';
import { setupZoomActions } from './actions/zoom.js';
import { setupSwapColors } from './actions/swap-colors.js';
import { setupSetBackground } from './actions/set-background.js';
import { setupCompress } from './actions/compress.js';
import { setupGridSizeSelect, setGridSize } from './actions/grid-size-select.js';
import { setupToggleToolsPanel } from './actions/toggle-tools-panel.js';

import { setupRotate } from './transforms/rotate.js';
import { setupFlipH } from './transforms/flip-h.js';
import { setupFlipV } from './transforms/flip-v.js';

import { setupUploadModal } from './io/upload/upload-modal.js';
import { exportPng } from './io/export/export-png.js';
import { exportJpeg } from './io/export/export-jpeg.js';
import { exportWebp } from './io/export/export-webp.js';
import { exportJson } from './io/export/export-json.js';

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

  // Initialize Canvas with default 32x32 grid
  setGridSize(32, 32);
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
  setupCompress();
  setupGridSizeSelect();
  setupToggleToolsPanel();
  setupUploadModal();

  const downloadModal = document.getElementById('downloadModal');
  const openDownloadModalBtn = document.getElementById('openDownloadModalBtn');
  const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');

  if (openDownloadModalBtn && downloadModal) {
    openDownloadModalBtn.addEventListener('click', () => {
      downloadModal.style.display = 'flex';
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

  document.querySelectorAll(".dl-format-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const format = btn.dataset.format;
      if (format === 'png') exportPng();
      else if (format === 'jpeg') exportJpeg();
      else if (format === 'webp') exportWebp();
      else if (format === 'json') exportJson();
      
      // Close modal after selection
      if (downloadModal) {
        downloadModal.style.display = 'none';
      }
    });
  });

  initCustomTooltip();
  initMobilePopups(); // Global document click handler inside

  setStatus(t('status.init'));
}

window.addEventListener('toolbar-mounted', () => {
  initEls();
  setupSwapColors();
  
  if (els.toolBtns) {
    els.toolBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        els.toolBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        setCurrentTool(btn.dataset.tool);
        setStatus(`${t("status.toolSelected")} ${btn.getAttribute("data-tooltip") || btn.title}`);
      });
    });
  }

  const shapeThicknessInputs = document.querySelectorAll(".shape-thickness");
  shapeThicknessInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      shapeThicknessInputs.forEach(other => other.value = e.target.value);
    });
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

window.addEventListener('canvas-mounted', () => {
  initEls();
  resizeCanvas();
  fitToScreen();
  renderPixels();
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
