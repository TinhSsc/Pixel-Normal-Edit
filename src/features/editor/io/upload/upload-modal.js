import { setStatus, setGridSizeParams, resetMaps, pixelMap } from '../../engine/core/state.js';
import { resizeCanvas, fitToScreen } from '../../engine/core/viewport.js';
import { renderPixels } from '../../engine/core/render.js';
import { resetHistory } from '../../engine/core/history.js';
import { setSourceImage } from '../../engine/actions/set-background.js';
import { t } from '../../../../i18n/i18n.js';
import { parseColorToUint32 } from '../../engine/core/color-utils.js';
import { syncGridSizeUI } from '../../engine/actions/grid-size-select.js';
import { handleZipFile, handleSpriteSheet, handleMultipleImageFrames } from './upload-animation.js';
import { createTabFromData, refreshUIAfterBatchImport, getTabs, getActiveTabId } from '../../engine/core/tab-manager.js';
export function setupUploadModal() {
  const modal = document.getElementById('uploadModal');
  const openBtn = document.getElementById('openUploadModalBtn');
  const closeBtn = document.getElementById('closeUploadModalBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const imageDropZone = document.getElementById('imageDropZone');
  const imageInput = document.getElementById('imageUploadModal');
  const jsonDropZone = document.getElementById('jsonDropZone');
  const jsonInput = document.getElementById('jsonUploadModal');
  const parseJsonBtn = document.getElementById('parseJsonTextBtn');
  const jsonTextarea = document.getElementById('jsonInputText');
  const autoSizeCheck = document.getElementById('autoSizeOnUpload');

  if (!modal) return;

  openBtn?.addEventListener('click', () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    modal.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.modal-content') || document;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });

  // Image & ZIP upload
  imageDropZone?.addEventListener('click', () => imageInput?.click());
  imageDropZone?.addEventListener('dragover', e => { e.preventDefault(); imageDropZone.classList.add('dragover'); });
  imageDropZone?.addEventListener('dragleave', () => imageDropZone.classList.remove('dragover'));
  const handleImageInput = async (filesArray) => {
    const mode = document.getElementById('importModeSelect')?.value || 'current-tab';
    const autoSize = autoSizeCheck?.checked;
    
    if (filesArray.length === 0) return;
    if (filesArray.length > 50) {
      alert(t('upload.maxFilesError') || "Vui lòng chọn tối đa 50 file để tránh quá tải bộ nhớ.");
      return;
    }
    
    const hasZip = filesArray.some(f => f.name.endsWith('.zip'));
    const hasImg = filesArray.some(f => !f.name.endsWith('.zip'));
    
    if (hasZip && hasImg) {
      alert(t('upload.mixFileError') || "Vui lòng không chọn lẫn file ZIP và file ảnh rời.");
      return;
    }
    
    if (mode === 'current-tab' && filesArray.length > 1) {
      alert(t('upload.singleFileOverrideError') || "Chế độ 'Ghi đè Tab hiện tại' chỉ hỗ trợ tải 1 file.");
      return;
    }
    
    const currentTab = getTabs().find(t => t.id === getActiveTabId());
    if (mode === 'current-tab' && currentTab?.animation?.isAnimationMode) {
      if (!window.confirm(t('upload.overrideAnimConfirm') || "Tab hiện tại đang là Ảnh động. Nếu ghi đè, toàn bộ frame sẽ bị xóa. Tiếp tục?")) return;
    }
    
    document.getElementById('uploadModal').style.display = 'none';
    
    if (hasZip) {
      handleZipFile(filesArray[0]);
    } else {
      await processImageBatch(filesArray, mode, autoSize);
    }
  };

  imageDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    handleImageInput(Array.from(e.dataTransfer.files));
  });
  
  imageInput?.addEventListener('change', () => {
    handleImageInput(Array.from(imageInput.files));
  });

  // JSON upload
  jsonDropZone?.addEventListener('click', () => jsonInput?.click());
  jsonDropZone?.addEventListener('dragover', e => { e.preventDefault(); jsonDropZone.classList.add('dragover'); });
  jsonDropZone?.addEventListener('dragleave', () => jsonDropZone.classList.remove('dragover'));
  jsonDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    jsonDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleJsonFile(file);
  });
  jsonInput?.addEventListener('change', () => {
    const file = jsonInput.files[0];
    if (file) handleJsonFile(file);
  });

  parseJsonBtn?.addEventListener('click', () => {
    const text = jsonTextarea?.value;
    if (text) handleJsonText(text);
  });
}

async function processImageBatch(files, mode, autoSize) {
  const imageObjects = [];
  let errorCount = 0;

  for (const file of files) {
    if (!file.name.match(/\.(png|jpe?g|gif|webp)$/i)) {
      errorCount++;
      continue;
    }
    try {
      const img = await loadImageObject(file);
      imageObjects.push({ name: file.name, img });
    } catch (e) {
      errorCount++;
    }
  }

  if (errorCount > 0) {
    alert((t('upload.skipFilesError') || 'Bỏ qua {count} file (không đúng định dạng hoặc lỗi đọc).').replace('{count}', errorCount));
  }

  if (imageObjects.length === 0) return;

  if (mode === 'animation') {
    if (imageObjects.length === 1) {
      const { img } = imageObjects[0];
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > h && w % h === 0 && (w / h) > 1) {
        handleSpriteSheet(img, w / h);
      } else {
        const numStr = window.prompt(t('upload.promptSpriteFrames') || "Nhập số khung hình ngang (frames) cho Sprite Sheet này:", "2");
        const numFrames = parseInt(numStr, 10);
        if (!isNaN(numFrames) && numFrames > 1) {
           handleSpriteSheet(img, numFrames);
        } else {
           handleMultipleImageFrames(imageObjects);
        }
      }
    } else {
      handleMultipleImageFrames(imageObjects);
    }
  } else if (mode === 'multi-tab') {
    imageObjects.forEach(({name, img}) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data32 = new Uint32Array(ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data.buffer);
      createTabFromData(name, img.naturalWidth, img.naturalHeight, data32);
    });
    refreshUIAfterBatchImport();
  } else {
    // mode === 'current-tab'
    const { img } = imageObjects[0];
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // Keep sprite sheet logic for current-tab mode
    if (w > h && w % h === 0 && w / h > 1) {
      const numFrames = w / h;
      if (window.confirm((t('upload.confirmSpriteAnim') || `Phát hiện Sprite Sheet gồm {count} khung hình ngang. Bạn có muốn tải lên thành dạng Ảnh động (Animation) không?`).replace('{count}', numFrames))) {
        handleSpriteSheet(img, numFrames);
        return;
      }
    }
    proceedWithImage(img, img.src, autoSize);
  }
}

function loadImageObject(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Lỗi đọc file ảnh"));
    img.src = src;
  });
}

export function handleImageFile(file, autoSize = true) {
  processImageBatch([file], 'current-tab', autoSize);
}

function proceedWithImage(img, src, autoSize) {
  setSourceImage(src);

  if (autoSize) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const newCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    newCtx.drawImage(img, 0, 0, w, h);
    const newData = newCtx.getImageData(0, 0, w, h);
    const newData32 = new Uint32Array(newData.data.buffer);
    setGridSizeParams(w, h, newData, newData32);
    syncGridSizeUI(w, h);
    
    const newPixelMap = new Uint32Array(newData32);
    const data = newData.data;
    for (let i = 0; i < newPixelMap.length; i++) {
       if (data[i * 4 + 3] <= 10) {
          newPixelMap[i] = 0;
       }
    }
    
    resetMaps(newPixelMap);
    resetHistory();
    resizeCanvas();
    fitToScreen();
    renderPixels();
  }

  const msg = t('status.imgLoaded');
  if (autoSize) {
    setStatus(`${msg} (${pixelMap.length.toLocaleString()} pixels)`);
  } else {
    setStatus(msg);
  }

  document.getElementById('uploadModal').style.display = 'none';
}

export function handleJsonFile(file) {
  const reader = new FileReader();
  reader.onload = e => handleJsonText(e.target.result);
  reader.readAsText(file);
}

export function handleJsonText(text) {
  try {
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      const errMsg = `${t('status.jsonError') || 'Lỗi cú pháp JSON:'} ${parseErr.message}`;
      setStatus(errMsg, true);
      alert(errMsg + "\n\nLời khuyên: Vui lòng kiểm tra các dấu ngoặc {}, dấu phẩy hoặc nháy kép \"\".");
      return;
    }

    if (!data || typeof data !== 'object') {
      const errMsg = "Dữ liệu JSON phải là một đối tượng (object) cấu hình.";
      setStatus(errMsg, true);
      alert(errMsg);
      return;
    }

    const missing = [];
    if (data.width === undefined) missing.push("width (Độ rộng canvas)");
    if (data.height === undefined) missing.push("height (Chiều cao canvas)");
    if (data.pixels === undefined) missing.push("pixels (Danh sách điểm ảnh)");
    
    if (missing.length > 0) {
      const errMsg = `JSON thiếu các trường bắt buộc:\n- ${missing.join('\n- ')}`;
      setStatus(errMsg, true);
      alert(errMsg + "\n\nLời khuyên: Bạn có thể click nút 'Xem mẫu thử' hoặc 'Tải JSON mẫu' để xem cấu trúc đúng.");
      return;
    }

    if (typeof data.width !== 'number' || typeof data.height !== 'number') {
      const errMsg = "Trường 'width' và 'height' bắt buộc phải là kiểu số (number).";
      setStatus(errMsg, true);
      alert(errMsg);
      return;
    }

    if (typeof data.pixels !== 'object' || data.pixels === null) {
      const errMsg = "Trường 'pixels' bắt buộc phải là một đối tượng chứa danh sách điểm ảnh.";
      setStatus(errMsg, true);
      alert(errMsg);
      return;
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = data.width;
    offCanvas.height = data.height;
    const newCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    const newData = newCtx.createImageData(data.width, data.height);
    const newData32 = new Uint32Array(newData.data.buffer);

    setGridSizeParams(data.width, data.height, newData, newData32);
    syncGridSizeUI(data.width, data.height);

    const newPixelMap = new Uint32Array(data.width * data.height);
    for (const [k, v] of Object.entries(data.pixels)) {
      let x, y;
      if (k.includes(',')) {
        [x, y] = k.split(',').map(Number);
      } else {
        const keyInt = parseInt(k, 10);
        x = keyInt >> 16;
        y = keyInt & 0xFFFF;
      }
      newPixelMap[y * data.width + x] = parseColorToUint32(v);
    }
    resetMaps(newPixelMap);
    resetHistory();
    resizeCanvas();
    fitToScreen();
    renderPixels();

    setStatus(`${t('status.jsonLoaded')} (${pixelMap.length.toLocaleString()} pixels)`);
    document.getElementById('uploadModal').style.display = 'none';
  } catch (err) {
    setStatus(`${t('status.jsonError')} ${err.message}`, true);
    alert(`Lỗi khi áp dụng cấu hình JSON: ${err.message}`);
  }
}
