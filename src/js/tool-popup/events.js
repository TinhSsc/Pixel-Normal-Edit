// events.js — gắn sự kiện: click expand, click variant, click pin, click quick-pin, click-outside
import { isExpanded, setExpanded, setActiveVariant, togglePin } from './popupState.js';
import { renderVariantList, updateToolBtnIcon, renderQuickPinBar } from './render.js';

let allBaseTools = [];

export function setBaseTools(baseTools) {
  allBaseTools = baseTools;
}

function closeAllLists() {
  // Not used anymore for local dropdowns, but we can keep it empty or remove.
  allBaseTools.forEach(bt => setExpanded(bt, false));
}

// Kích hoạt 1 variant: đổi icon + tái sử dụng cơ chế .tool-btn click có sẵn trong main.js
function activateVariant(baseTool, variantId) {
  setActiveVariant(baseTool, variantId);
  updateToolBtnIcon(baseTool, variantId);
  const btn = document.querySelector(`.tool-btn[data-tool="${baseTool}"]`);
  if (btn) btn.click();
}

export function bindWrapperEvents(wrapper, baseTool) {
  const popup = wrapper.querySelector('.tool-popup');
  const expandBtn = popup?.querySelector('.tool-popup-expand-btn');
  const list = document.getElementById(`variants-container-${baseTool}`);
  
  if (expandBtn && !expandBtn.dataset.bound) {
    expandBtn.dataset.bound = 'true';
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // 1. Open the global modal
      const modal = document.getElementById('globalSettingsModal');
      if (modal) modal.style.display = 'flex';
      
      // 2. Select Draw Tools tab
      const drawToolsTabBtn = document.querySelector('.tab-btn[data-tab="tab-draw-tools"]');
      if (drawToolsTabBtn) drawToolsTabBtn.click();
      
      // 3. Select the correct subtab if it exists
      const subtabBtn = document.querySelector(`.nested-tab-btn[data-subtab="subtab-${baseTool}"]`);
      if (subtabBtn) subtabBtn.click();
      
      // Note: We don't hide the local popup here, it might auto-close or stay open.
    });
  }

  if (list && !list.dataset.bound) {
    list.dataset.bound = 'true';
    list.addEventListener('click', (e) => {
      const pinBtn = e.target.closest('.tool-variant-pin-btn');
      if (pinBtn) {
        e.stopPropagation();
        togglePin(baseTool, pinBtn.dataset.variantId);
        renderVariantList(baseTool);
        renderQuickPinBar(allBaseTools);
        return;
      }
      const item = e.target.closest('.tool-variant-item');
      if (item) {
        activateVariant(baseTool, item.dataset.variantId);
        renderVariantList(baseTool);
        renderQuickPinBar(allBaseTools);
      }
    });
  }
}

export function bindQuickPinBarEvents() {
  if (document.body.dataset.quickPinBound) return;
  document.body.dataset.quickPinBound = 'true';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tool-quick-pin-btn');
    if (!btn) return;
    const { baseTool, variantId } = btn.dataset;
    activateVariant(baseTool, variantId);
    renderVariantList(baseTool);
    renderQuickPinBar(allBaseTools);
  });
}

export function bindGlobalClickOutside() {
  if (document.body.dataset.toolPopupOutsideBound) return;
  document.body.dataset.toolPopupOutsideBound = 'true';

  document.addEventListener('click', (e) => {
    if (e.target.closest('.tool-variant-list') || e.target.closest('.tool-popup-expand-btn')) return;
    closeAllLists();
  });
}

export function bindNestedTabsEvents() {
  if (document.body.dataset.nestedTabsBound) return;
  document.body.dataset.nestedTabsBound = 'true';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nested-tab-btn');
    if (!btn) return;
    const container = btn.closest('.tab-content');
    if (!container) return;
    
    container.querySelectorAll('.nested-tab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.nested-tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const targetId = btn.dataset.subtab;
    const targetContent = container.querySelector('#' + targetId);
    if (targetContent) targetContent.classList.add('active');
  });
}
