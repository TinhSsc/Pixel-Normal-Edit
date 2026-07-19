/**
 * preview-group-manager.js
 * Quản lý mọi tương tác, DOM, API liên quan đến khung preview của ứng dụng.
 */

const GAP = 32;

let previewItems = [

];

let listeners = [];
let currentBgSrc = null;
let prevItemsById = new Map();
let prevActiveFrameId = null;

export function getPreviewItems() {
  return previewItems;
}

export function forceRedrawAllPreviews() {
  prevItemsById.clear();
}

export function subscribeLayoutChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

function notifyListeners() {
  listeners.forEach(cb => cb([...previewItems]));
}

export function syncPreviewsWithFrames(frames, activeFrameIndex, isAnimationMode) {
  if (!isAnimationMode) {
    previewItems = [];
    prevItemsById = new Map();
    prevActiveFrameId = null;
  } else {
    const newActiveFrameId = frames[activeFrameIndex] ? frames[activeFrameIndex].id : null;
    const newItems = [];

    for (let i = 0; i < frames.length; i++) {
      if (i === activeFrameIndex) continue;

      const frame = frames[i];
      const positionIndex = i - activeFrameIndex;
      const existing = prevItemsById.get(frame.id);

      // Chỉ cần vẽ lại (dirty) nếu:
      // - đây chính là frame vừa bị rời khỏi (pixel data của nó vừa được cập nhật)
      // - item trước đó vẫn đang dirty (chưa kịp vẽ)
      const needsDirty = !existing || frame.id === prevActiveFrameId || existing.dirty;

      newItems.push({
        id: frame.id,
        positionIndex,
        type: 'frame-preview',
        frame,
        dirty: needsDirty
      });
    }

    previewItems = newItems;
    prevItemsById = new Map(newItems.map(item => [item.id, item]));
    prevActiveFrameId = newActiveFrameId;
  }
  notifyListeners();
}


// A. CÁC HÀM KHỞI TẠO VÀ CẬP NHẬT UI HIỆN TẠI

/**
 * Cập nhật thuộc tính hiển thị (pan, zoom, lưới) cho preview group.
 */
export function updatePreviewTransform(panX, panY, zoom, GRID_WIDTH, GRID_HEIGHT, showGridFlag) {
  previewItems.forEach(item => {
    const offsetX = item.positionIndex * (GRID_WIDTH * zoom + GAP);

    const previewGroup = document.getElementById(`group-${item.id}`);
    if (previewGroup) {
      previewGroup.style.transform = `translate(${panX + offsetX}px, ${panY}px)`;
    }

    const previewCanvas = document.getElementById(item.id);
    if (previewCanvas) {
      previewCanvas.style.width = `${GRID_WIDTH * zoom}px`;
      previewCanvas.style.height = `${GRID_HEIGHT * zoom}px`;
      previewCanvas.style.setProperty('--canvas-zoom', zoom);

      // Re-apply background if it exists
      if (currentBgSrc) {
        previewCanvas.style.setProperty('--bg-url', `url("${currentBgSrc}")`);
        previewCanvas.classList.add('has-bg');
      } else {
        previewCanvas.classList.remove('has-bg');
        previewCanvas.style.removeProperty('--bg-url');
      }
    }

    const previewGridOverlay = document.getElementById(`grid-${item.id}`);
    if (previewGridOverlay) {
      previewGridOverlay.style.width = `${GRID_WIDTH * zoom}px`;
      previewGridOverlay.style.height = `${GRID_HEIGHT * zoom}px`;
      previewGridOverlay.style.border = `1px solid #3e3e4a`;
      previewGridOverlay.style.boxSizing = 'content-box';

      if (zoom > 4 && showGridFlag) {
        previewGridOverlay.style.backgroundImage = `
          linear-gradient(to right, var(--color-grid-line) 1px, transparent 1px),
          linear-gradient(to bottom, var(--color-grid-line) 1px, transparent 1px)
        `;
        previewGridOverlay.style.backgroundSize = `${zoom}px ${zoom}px`;
        previewGridOverlay.style.backgroundPosition = `0 0`;
      } else {
        previewGridOverlay.style.backgroundImage = 'none';
      }
    }
  });
}

/**
 * Copy pixel data từ main canvas sang preview canvas.
 */
export function syncPreviewPixels(mainCanvas, GRID_WIDTH, GRID_HEIGHT) {
  if (!mainCanvas) return;

  // Sync active frame's thumbnail in AnimationStripPanel
  if (prevActiveFrameId) {
    const thumbCanvas = document.getElementById(`thumb-${prevActiveFrameId}`);
    if (thumbCanvas) {
      thumbCanvas.width = GRID_WIDTH;
      thumbCanvas.height = GRID_HEIGHT;
      const tctx = thumbCanvas.getContext('2d');
      tctx.imageSmoothingEnabled = false;
      tctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
      tctx.drawImage(mainCanvas, 0, 0);
    }
  }

  previewItems.forEach(item => {
    if (item.type === 'live-mirror') {
      const previewCanvas = document.getElementById(item.id);
      if (previewCanvas) {
        previewCanvas.width = GRID_WIDTH;
        previewCanvas.height = GRID_HEIGHT;
        const pctx = previewCanvas.getContext('2d');
        pctx.imageSmoothingEnabled = false;
        pctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
        pctx.drawImage(mainCanvas, 0, 0);
      }
    } else if (item.type === 'frame-preview' && item.frame && item.frame.pixelMap && item.dirty) {
      const previewCanvas = document.getElementById(item.id);
      if (previewCanvas) {
        previewCanvas.width = GRID_WIDTH;
        previewCanvas.height = GRID_HEIGHT;
        const pctx = previewCanvas.getContext('2d');
        pctx.imageSmoothingEnabled = false;
        pctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
        const imgData = pctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
        const data32 = new Uint32Array(imgData.data.buffer);
        data32.set(item.frame.pixelMap);
        pctx.putImageData(imgData, 0, 0);
        item.dirty = false;
      }
    }
  });
}

/**
 * Thiết lập ảnh nền cho preview.
 */
export function setPreviewBackground(src) {
  currentBgSrc = src;
  previewItems.forEach(item => {
    const c = document.getElementById(item.id);
    if (c) {
      c.style.setProperty('--bg-url', `url("${src}")`);
      c.classList.add('has-bg');
    }
  });
}

/**
 * Xoá bỏ ảnh nền khỏi preview.
 */
export function removePreviewBackground() {
  currentBgSrc = null;
  previewItems.forEach(item => {
    const c = document.getElementById(item.id);
    if (c) {
      c.classList.remove('has-bg');
      c.style.removeProperty('--bg-url');
    }
  });
}

// B. CÁC HÀM STUBS CHO TƯƠNG LAI

export function duplicatePreviewGroup() {
  console.warn("Chưa implement: duplicatePreviewGroup");
}

export function addPreviewImage(positionIndex, type = 'static', src = null) {
  const newId = `preview-${Date.now()}`;
  previewItems.push({ id: newId, positionIndex, type, src });
  notifyListeners();
}

export function removePreviewImage(imageId) {
  previewItems = previewItems.filter(p => p.id !== imageId);
  notifyListeners();
}

export function movePreviewImage(imageId, newPositionIndex) {
  const item = previewItems.find(p => p.id === imageId);
  if (item) {
    item.positionIndex = newPositionIndex;
    notifyListeners();
  }
}

export function reorderPreviewImages(orderArray) {
  console.warn("Chưa implement: reorderPreviewImages");
}

export function transferToMainCanvas() {
  console.warn("Chưa implement: transferToMainCanvas");
}
