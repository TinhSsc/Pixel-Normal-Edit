// index.js — entrypoint duy nhất. Gọi initToolPopup() sau mỗi lần toolbar mount (main.js).
import { TOOL_VARIANTS } from './toolVariants.js';
import { enhancePopup } from './render.js';
import { bindWrapperEvents, bindQuickPinBarEvents, bindGlobalClickOutside, setBaseTools, bindNestedTabsEvents } from './events.js';

export function initToolPopup() {
  // Expose TOOL_VARIANTS để React ToolGroup có thể đọc metadata variant
  window.__TOOL_VARIANTS__ = TOOL_VARIANTS;

  const wrappers = Array.from(document.querySelectorAll('.toolbar [data-variants]'))
    .filter(w => TOOL_VARIANTS[w.dataset.variants]);

  const baseTools = wrappers.map(w => w.dataset.variants);
  setBaseTools(baseTools);

  wrappers.forEach(wrapper => {
    const baseTool = wrapper.dataset.variants;
    enhancePopup(wrapper, baseTool);
    bindWrapperEvents(wrapper, baseTool);
  });

  // renderQuickPinBar không còn cần thiết vì ToolGroup.jsx (React) tự render pinned buttons
  bindQuickPinBarEvents();
  bindGlobalClickOutside();
  bindNestedTabsEvents();
}
