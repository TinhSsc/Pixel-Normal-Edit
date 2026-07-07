import { els } from './state.js';

/**
 * Quản lý thứ gì sẽ RESET lại sau khi F5
 * Phục hồi các giá trị đã lưu, nhưng chủ động huỷ (reset) các công cụ không được phép.
 */
export function loadAndResetToolbarState() {
  try {
    const state = JSON.parse(localStorage.getItem('pixel_toolbar_state') || '{}');
    
    // Phục hồi Settings
    if (state.color1 && els.colorPicker) els.colorPicker.value = state.color1;
    if (state.color2 && els.colorPicker2) els.colorPicker2.value = state.color2;
    if (state.pixelPenSize) {
      const p = document.getElementById('pixelPenSize');
      if (p) p.value = state.pixelPenSize;
    }
    if (state.highlightPenSize) {
      const h = document.getElementById('highlightPenSize');
      if (h) h.value = state.highlightPenSize;
    }
    if (state.blendBrushSize) {
      const b = document.getElementById('blendBrushSize');
      if (b) b.value = state.blendBrushSize;
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
    if (state.sprayPenSize) {
      const sp = document.getElementById('sprayPenSize');
      if (sp) sp.value = state.sprayPenSize;
    }
    if (state.sprayPenDensity) {
      const sd = document.getElementById('sprayPenDensity');
      if (sd) sd.value = state.sprayPenDensity;
    }
    if (state.replaceTolerance) {
      const rt = document.getElementById('replaceTolerance');
      if (rt) rt.value = state.replaceTolerance;
    }
    if (state.globalPenShape) {
      const gs = document.getElementById('globalPenShape');
      if (gs) gs.value = state.globalPenShape;
    }
    
    // Logic Reset / Phục hồi Công cụ
    const RESET_ON_F5_TOOLS = ['crop']; // Các công cụ sẽ bị reset (tắt) khi F5
    
    if (state.currentTool && !RESET_ON_F5_TOOLS.includes(state.currentTool)) {
      // Nếu là công cụ an toàn, phục hồi nó
      const btn = document.querySelector(`.tool-btn[data-tool="${state.currentTool}"]`);
      if (btn) btn.click();
    } else {
      // Nếu là công cụ trong danh sách bị reset (ví dụ: crop), hoặc không có công cụ nào
      // => Tự động reset về trạng thái "Không có gì cả"
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      import('./state.js').then(({ setCurrentTool }) => setCurrentTool(''));
    }
  } catch(e) {
    console.error("Lỗi khi phục hồi toolbar state", e);
  }
}
