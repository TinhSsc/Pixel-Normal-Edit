// render.js — dựng DOM: nút expand, danh sách variant, quick-pin bar, đổi icon tool-btn.
// Không tự ý kích hoạt tool ở đây — chỉ vẽ UI. events.js gọi các hàm này sau khi xử lý state.
import { TOOL_VARIANTS } from './toolVariants.js';
import { getActiveVariant, getPins } from './popupState.js';

export function getVariant(baseTool, variantId) {
  return (TOOL_VARIANTS[baseTool] || []).find(v => v.id === variantId);
}

// Chèn nút expand vào trong .tool-popup của 1 wrapper (gọi 1 lần/wrapper)
export function enhancePopup(wrapper, baseTool) {
  renderVariantList(baseTool); // Always render variant list in Settings

  const popup = wrapper.querySelector('.tool-popup');
  if (!popup || popup.querySelector('.tool-popup-expand-btn')) return; // đã enhance rồi

  const expandBtn = document.createElement('button');
  expandBtn.type = 'button';
  expandBtn.className = 'tool-popup-expand-btn';
  expandBtn.innerHTML = '<i data-lucide="settings-2"></i>'; // changed icon to settings
  expandBtn.title = 'Mở cài đặt công cụ';
  popup.appendChild(expandBtn);

  if (window.lucide) window.lucide.createIcons();
}

// Vẽ lại nội dung danh sách variant vào modal settings (gọi lại mỗi khi active/pin thay đổi)
export function renderVariantList(baseTool) {
  const list = document.getElementById(`variants-container-${baseTool}`);
  if (!list) return;
  list.className = 'tool-variant-list show'; // Always show inside the modal tab
  
  const variants = TOOL_VARIANTS[baseTool] || [];
  const activeId = getActiveVariant(baseTool, variants[0]?.id);
  const pins = getPins(baseTool);

  list.innerHTML = variants.map(v => `
    <div class="tool-variant-item${v.id === activeId ? ' active' : ''}" data-variant-id="${v.id}">
      <i data-lucide="${v.icon}"></i>
      <span>${v.label}</span>
      <button type="button" class="tool-variant-pin-btn${pins.includes(v.id) ? ' pinned' : ''}" data-variant-id="${v.id}">
        <i data-lucide="pin"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Đổi icon hiển thị trên .tool-btn gốc theo variant đang chọn
export function updateToolBtnIcon(baseTool, variantId) {
  const variant = getVariant(baseTool, variantId);
  const icon = document.querySelector(`.tool-btn[data-tool="${baseTool}"] i[data-lucide]`);
  if (!variant || !icon) return;
  icon.setAttribute('data-lucide', variant.icon);
  if (window.lucide) window.lucide.createIcons();
}

// Dựng/cập nhật 1 thanh Quick Pin bên trong .tool-popup của từng tool
export function renderQuickPinBar(baseTools) {
  baseTools.forEach(baseTool => {
    const wrapper = document.querySelector(`.toolbar [data-variants="${baseTool}"]`);
    if (!wrapper) return;

    const grid = wrapper.closest('.tool-grid');
    if (!grid) return;

    // Remove old pinned buttons from grid
    grid.querySelectorAll(`.pinned-tool-btn[data-base-tool="${baseTool}"]`).forEach(el => el.remove());

    const pins = getPins(baseTool);
    const activeId = getActiveVariant(baseTool, (TOOL_VARIANTS[baseTool] || [])[0]?.id);
    
    // Insert after the wrapper
    const nextSibling = wrapper.nextSibling;

    pins.forEach(variantId => {
      const variant = getVariant(baseTool, variantId);
      if (!variant) return;

      const btn = document.createElement('button');
      btn.className = `tool-btn pinned-tool-btn${variant.id === activeId ? ' active' : ''}`;
      btn.dataset.baseTool = baseTool;
      btn.dataset.variantId = variant.id;
      btn.dataset.pinned = 'true';
      btn.dataset.tooltip = variant.label;
      btn.title = variant.label;
      btn.innerHTML = `<i data-lucide="${variant.icon}"></i>`;
      
      grid.insertBefore(btn, nextSibling);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}
