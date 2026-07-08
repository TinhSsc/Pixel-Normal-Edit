import { setStatus, setGridSizeParams, resetMaps } from '../../core/state.js';
import { resizeCanvas, fitToScreen } from '../../core/viewport.js';
import { renderPixels } from '../../core/render.js';
import { resetHistory } from '../../core/history.js';
import { setSourceImage } from '../../actions/set-background.js';
import { t } from '../../lang/i18n.js';
import { parseColorToUint32 } from '../../core/color-utils.js';
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

  // Image upload
  imageDropZone?.addEventListener('click', () => imageInput?.click());
  imageDropZone?.addEventListener('dragover', e => { e.preventDefault(); imageDropZone.classList.add('dragover'); });
  imageDropZone?.addEventListener('dragleave', () => imageDropZone.classList.remove('dragover'));
  imageDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file, autoSizeCheck?.checked);
  });
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) handleImageFile(file, autoSizeCheck?.checked);
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

export function handleImageFile(file, autoSize = true) {
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth * img.naturalHeight > 1000000) {
      import('../../lang/i18n.js').then(({ t }) => {
        if (!window.confirm(t('status.largeImgWarning'))) {
          document.getElementById('uploadModal').style.display = 'none';
          URL.revokeObjectURL(src);
          return;
        }
        proceedWithImage(img, src, autoSize);
      });
    } else {
      proceedWithImage(img, src, autoSize);
    }
  };
  img.src = src;
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
    import('../../actions/grid-size-select.js').then(({ syncGridSizeUI }) => syncGridSizeUI(w, h));
    
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

  setStatus(setStatus => setStatus, false);
  import('../../core/state.js').then(({ setStatus, pixelMap }) => {
    import('../../lang/i18n.js').then(({ t }) => {
      const msg = t('status.imgLoaded');
      if (autoSize) {
        setStatus(`${msg} (${pixelMap.length.toLocaleString()} pixels)`);
      } else {
        setStatus(msg);
      }
    });
  });

  document.getElementById('uploadModal').style.display = 'none';
}

export function handleJsonFile(file) {
  const reader = new FileReader();
  reader.onload = e => handleJsonText(e.target.result);
  reader.readAsText(file);
}

export function handleJsonText(text) {
  try {
    const data = JSON.parse(text);
    if (!data.width || !data.height || !data.pixels) {
      import('../../lang/i18n.js').then(({ t }) => {
        import('../../core/state.js').then(({ setStatus }) => setStatus(t('status.jsonInvalid'), true));
      });
      return;
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = data.width;
    offCanvas.height = data.height;
    const newCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    const newData = newCtx.createImageData(data.width, data.height);
    const newData32 = new Uint32Array(newData.data.buffer);

    setGridSizeParams(data.width, data.height, newData, newData32);
    import('../../actions/grid-size-select.js').then(({ syncGridSizeUI }) => syncGridSizeUI(data.width, data.height));

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

    import('../../lang/i18n.js').then(({ t }) => {
      import('../../core/state.js').then(({ setStatus, pixelMap }) => {
        setStatus(`${t('status.jsonLoaded')} (${pixelMap.length.toLocaleString()} pixels)`);
      });
    });
    document.getElementById('uploadModal').style.display = 'none';
  } catch (err) {
    import('../../lang/i18n.js').then(({ t }) => {
      import('../../core/state.js').then(({ setStatus }) => setStatus(`${t('status.jsonError')} ${err.message}`, true));
    });
  }
}
