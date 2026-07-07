// events.js — gắn sự kiện: click expand, click variant, click pin, click quick-pin, click-outside
import { isExpanded, setExpanded, setActiveVariant, togglePin, getActiveVariant } from './popupState.js';
import { renderVariantList, updateToolBtnIcon } from './render.js';
import { setCurrentTool, setStatus } from '../core/state.js';
import { t } from '../lang/i18n.js';

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
  // Cập nhật window.__ACTIVE_VARIANTS__ để React PinnedVariantBtn đọc được
  if (!window.__ACTIVE_VARIANTS__) window.__ACTIVE_VARIANTS__ = {};
  window.__ACTIVE_VARIANTS__[baseTool] = variantId;
  window.dispatchEvent(new CustomEvent('active-variant-changed'));
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
      const subtabBtn = document.querySelector(`.nested-tab-btn[data-tools~="${baseTool}"]`);
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
        // React ToolGroup tự re-render qua event 'pins-changed' từ popupState.js
        return;
      }
      const item = e.target.closest('.tool-variant-item');
      if (item) {
        activateVariant(baseTool, item.dataset.variantId);
        renderVariantList(baseTool);
      }
    });
  }
}

export function bindQuickPinBarEvents() {
  if (document.body.dataset.quickPinBound) return;
  document.body.dataset.quickPinBound = 'true';

  // Xử lý pinned-variant-click từ React PinnedVariantBtn component
  window.addEventListener('pinned-variant-click', (e) => {
    const { baseTool, variantId, label } = e.detail;
    // Xóa active khỏi mọi tool-btn (bao gồm cả .pinned-tool-btn)
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    setCurrentTool(baseTool, variantId);
    setStatus(`${t('status.toolSelected') || 'Selected'} ${label}`);
    // Cập nhật icon trên tool-btn gốc
    updateToolBtnIcon(baseTool, variantId);
    // Expose để React PinnedVariantBtn sync trạng thái active
    if (!window.__ACTIVE_VARIANTS__) window.__ACTIVE_VARIANTS__ = {};
    window.__ACTIVE_VARIANTS__[baseTool] = variantId;
    window.dispatchEvent(new CustomEvent('active-variant-changed'));
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pinned-tool-btn');
    if (btn) {
      e.stopPropagation(); // Stop bubbling so other handlers don't override
      
      const { baseTool, variantId } = btn.dataset;
      
      // Remove active from ALL tool buttons
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      
      // Set THIS pinned button as active
      btn.classList.add('active');
      
      // Set tool and variant directly
      setCurrentTool(baseTool, variantId);
      setStatus(`${t("status.toolSelected") || 'Selected'} ${btn.title}`);
      
      return;
    }
    
    // If they clicked a normal tool button
    const normalToolBtn = e.target.closest('.tool-btn');
    if (normalToolBtn && !normalToolBtn.classList.contains('pinned-tool-btn')) {
      // It's a main tool button. Remove active from all pinned tools
      document.querySelectorAll('.pinned-tool-btn').forEach(el => el.classList.remove('active'));
      
      // We also need to tell the state what variant the main tool is currently set to!
      // Because main.js only sets the base tool (setCurrentTool(btn.dataset.tool)).
      // It doesn't pass the variant.
      // So we can intercept it here and update the variant!
      const baseTool = normalToolBtn.dataset.tool;
      if (baseTool) {
        const variantId = getActiveVariant(baseTool, null);
        // We let main.js handle adding .active to the normal tool button
        // But we just update the variant in state!
        setCurrentTool(baseTool, variantId);
      }
    }
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
