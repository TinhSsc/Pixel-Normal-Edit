import { pixelMap, setStatus, els } from '../core/state.js';
import { resetHistory } from '../core/history.js';
import { renderPixels } from '../core/render.js';
import { t } from '../lang/i18n.js';

export function setupNewCanvas() {
  const newCanvasBtn = document.getElementById('newCanvasBtn');
  if (!newCanvasBtn) return;
  
  newCanvasBtn.addEventListener('click', () => {
    if (pixelMap.size > 0) {
      if (!window.confirm(t('confirm.newCanvas') || "Bạn có chắc muốn tạo trang mới? Mọi dữ liệu hiện tại sẽ bị mất!")) {
        return;
      }
    }
    
    // Clear canvas
    pixelMap.clear();
    resetHistory();
    
    // Remove background if any
    if (els.imagePreview) {
      els.imagePreview.src = '';
      els.imagePreview.style.display = 'none';
      if (document.documentElement.style.getPropertyValue('--bg-image')) {
        document.documentElement.style.removeProperty('--bg-image');
      }
    }
    
    renderPixels();
    setStatus(t('status.newCanvas') || "Đã tạo trang mới.");
  });
}
