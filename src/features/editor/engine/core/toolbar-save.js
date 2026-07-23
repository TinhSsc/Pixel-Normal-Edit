import { els } from './state.js';

/**
 * Quản lý việc gì sẽ LƯU
 * Lấy các giá trị hiện tại của UI và lưu vào localStorage.
 */
export function saveToolbarState() {
  let activeTool = document.querySelector('.tool-btn.active')?.dataset?.tool || '';
  
  // Bạn có thể thêm logic loại trừ lưu trữ ở đây, nhưng theo yêu cầu
  // việc quyết định reset cái gì sẽ do file toolbar-reset.js đảm nhận.
  // Tuy nhiên, ta vẫn có thể chặn lưu ở đây cho an toàn kép.
  const NO_SAVE_TOOLS = ['crop', 'text'];
  if (NO_SAVE_TOOLS.includes(activeTool)) {
    activeTool = '';
  }
  
  const state = {
    color1: els.colorPicker?.value,
    color2: els.colorPicker2?.value,
    pixelPenSize: document.getElementById('pixelPenSize')?.value,
    highlightPenSize: document.getElementById('highlightPenSize')?.value,
    blendBrushSize: document.getElementById('blendBrushSize')?.value,
    eraserSize: document.getElementById('eraserSize')?.value,
    outlineThickness: document.getElementById('outlineThickness')?.value,
    shapeThickness: document.querySelector('.shape-thickness')?.value,
    sprayPenSize: document.getElementById('sprayPenSize')?.value,
    sprayPenDensity: document.getElementById('sprayPenDensity')?.value,
    replaceTolerance: document.getElementById('replaceTolerance')?.value,
    globalPenShape: document.getElementById('globalPenShape')?.value,
    currentTool: activeTool
  };
  
  localStorage.setItem('pixel_toolbar_state', JSON.stringify(state));
}
