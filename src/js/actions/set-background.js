import { els, setStatus, pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../core/state.js';
import { t, getCurrentLang } from '../lang/i18n.js';
import { debouncedSaveWorkspace } from '../core/tab-manager.js';
import { beginStroke, recordChange, commitStroke } from '../core/history.js';
import { uint32ToRgba } from '../core/color-utils.js';
import { renderPixels } from '../core/render.js';
import { setPreviewBackground, removePreviewBackground } from '../preview/preview-group-manager.js';

let bgImage = null;

export function getBgImage() { return bgImage; }

export function updateBgButtonsUI() {
  const hasBg = !!bgImage;
  
  if (els.setBgBtn) els.setBgBtn.style.display = hasBg ? 'none' : '';
  if (els.replaceBgBtn) els.replaceBgBtn.style.display = hasBg ? '' : 'none';
  if (els.flattenBgBtn) els.flattenBgBtn.style.display = hasBg ? '' : 'none';
}

function showFlattenConfirmDialog() {
  return new Promise((resolve) => {
    // Modal background overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.transition = 'opacity 0.2s ease-out';

    // Modal container
    const container = document.createElement('div');
    container.style.backgroundColor = 'var(--surface-2,  #1e1e22)';
    container.style.border = '1px solid var(--border,  #333)';
    container.style.borderRadius = '12px';
    container.style.padding = '24px';
    container.style.width = '420px';
    container.style.maxWidth = '90%';
    container.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
    container.style.transform = 'scale(0.95)';
    container.style.transition = 'transform 0.2s ease-out';
    container.style.color = 'var(--text-primary,  #eee)';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Title
    const title = document.createElement('h3');
    title.textContent = getCurrentLang() === 'vi' ? 'Gộp ảnh nền' : 'Flatten Background';
    title.style.margin = '0 0 12px 0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';
    title.style.color = 'var(--text-primary,  #fff)';

    // Message
    const message = document.createElement('p');
    message.textContent = getCurrentLang() === 'vi' 
      ? 'Chọn phương thức gộp ảnh nền vào canvas. Thao tác này sẽ biến ảnh nền thành một phần của canvas và không thể chỉnh sửa riêng biệt được nữa!'
      : 'Choose how to flatten the background into the canvas. This will merge the background image into the canvas pixels and it can no longer be edited separately!';
    message.style.margin = '0 0 20px 0';
    message.style.fontSize = '14px';
    message.style.lineHeight = '1.5';
    message.style.color = 'var(--text-muted,  #aaa)';

    // Button container
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.flexDirection = 'column';
    btnContainer.style.gap = '10px';

    // Option 1: Overwrite
    const btnOverwrite = document.createElement('button');
    btnOverwrite.className = 'btn';
    btnOverwrite.style.padding = '10px';
    btnOverwrite.style.fontSize = '13px';
    btnOverwrite.style.fontWeight = '600';
    btnOverwrite.style.cursor = 'pointer';
    btnOverwrite.style.textAlign = 'left';
    btnOverwrite.innerHTML = getCurrentLang() === 'vi' 
      ? '⚡ Ghi đè toàn bộ ảnh nền lên canvas' 
      : '⚡ Overwrite entire canvas with background';
    btnOverwrite.onclick = () => {
      cleanup();
      resolve('overwrite');
    };

    // Option 2: Transparent (fill empty spaces)
    const btnTransparent = document.createElement('button');
    btnTransparent.className = 'btn';
    btnTransparent.style.padding = '10px';
    btnTransparent.style.fontSize = '13px';
    btnTransparent.style.fontWeight = '600';
    btnTransparent.style.cursor = 'pointer';
    btnTransparent.style.textAlign = 'left';
    btnTransparent.style.backgroundColor = 'var(--accent,  #5b5bf0)';
    btnTransparent.style.color = '#fff';
    btnTransparent.style.border = 'none';
    btnTransparent.innerHTML = getCurrentLang() === 'vi'
      ? '✨ Chỉ thay thế lên các chỗ chưa vẽ'
      : '✨ Fill transparent pixels only';
    btnTransparent.onclick = () => {
      cleanup();
      resolve('transparent');
    };

    // Cancel Button
    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn';
    btnCancel.style.padding = '10px';
    btnCancel.style.fontSize = '13px';
    btnCancel.style.background = 'transparent';
    btnCancel.style.border = '1px solid rgba(255,255,255,0.1)';
    btnCancel.style.cursor = 'pointer';
    btnCancel.textContent = getCurrentLang() === 'vi' ? 'Hủy bỏ' : 'Cancel';
    btnCancel.onclick = () => {
      cleanup();
      resolve(null);
    };

    btnContainer.appendChild(btnTransparent);
    btnContainer.appendChild(btnOverwrite);
    btnContainer.appendChild(btnCancel);

    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(btnContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Animate scale in
    requestAnimationFrame(() => {
      container.style.transform = 'scale(1)';
    });

    function cleanup() {
      container.style.transform = 'scale(0.95)';
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }, 150);
    }
  });
}

export function setupSetBackground() {
  if (!els.setBgBtn) return;

  // Hidden file input for picking background image
  let fileInput = document.getElementById('_bgFileInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = '_bgFileInput';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    
    if (bgImage && bgImage.startsWith('blob:')) {
      URL.revokeObjectURL(bgImage);
    }

    const src = URL.createObjectURL(file);
    bgImage = src;

    if (els.imagePreview) {
      els.imagePreview.src = src;
      els.imagePreview.style.display = 'block';
    }

    const mainCanvas = document.getElementById('pixelCanvas');
    if (mainCanvas) {
      mainCanvas.style.setProperty('--bg-url', `url("${src}")`);
      mainCanvas.classList.add('has-bg');
    }
    setPreviewBackground(src);

    setStatus(t('status.bgOn'));
    updateBgButtonsUI();
    // Reset so same file can be picked again
    fileInput.value = '';
    debouncedSaveWorkspace();
  };

  els.setBgBtn.onclick = () => {
    fileInput.click();
  };

  if (els.replaceBgBtn) {
    els.replaceBgBtn.onclick = () => {
      fileInput.click();
    };
  }

  if (els.flattenBgBtn) {
    els.flattenBgBtn.onclick = async () => {
      if (!bgImage) return;

      const choice = await showFlattenConfirmDialog();
      if (!choice) return;

      try {
        setStatus(t('status.imgProcessing') || 'Processing image...');

        // Load background image
        const img = new Image();
        img.src = bgImage;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to load background image"));
        });

        // Draw background image scaled to grid dimensions
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GRID_WIDTH;
        tempCanvas.height = GRID_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, GRID_WIDTH, GRID_HEIGHT);

        const imgData = tempCtx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT);
        const data32 = new Uint32Array(imgData.data.buffer);

        // Merge background into pixelMap
        beginStroke();
        let changed = false;

        if (choice === 'overwrite') {
          for (let idx = 0; idx < pixelMap.length; idx++) {
            const currentPixel = pixelMap[idx];
            const bgPixel = data32[idx];
            if (currentPixel !== bgPixel) {
              recordChange(idx, currentPixel, bgPixel);
              pixelMap[idx] = bgPixel;
              changed = true;
            }
          }
        } else if (choice === 'transparent') {
          for (let idx = 0; idx < pixelMap.length; idx++) {
            const currentPixel = pixelMap[idx];
            if (uint32ToRgba(currentPixel).a === 0) {
              const bgPixel = data32[idx];
              if (bgPixel !== 0) {
                recordChange(idx, currentPixel, bgPixel);
                pixelMap[idx] = bgPixel;
                changed = true;
              }
            }
          }
        }

        if (changed) {
          commitStroke(pixelMap);
          renderPixels();
        } else {
          commitStroke(pixelMap);
        }

        // Remove background layer styling from canvas (but keep preview intact)
        const mainCanvas = document.getElementById('pixelCanvas');
        if (mainCanvas) {
          mainCanvas.classList.remove('has-bg');
          mainCanvas.style.removeProperty('--bg-url');
        }
        removePreviewBackground();

        setStatus(t('status.bgFlattened'));
        updateBgButtonsUI();
        debouncedSaveWorkspace();
      } catch (err) {
        console.error(err);
        setStatus(err.message || 'Error flattening background', true);
      }
    };
  }
}

export function setSourceImage(src) {
  bgImage = src;
  if (els.imagePreview) {
    if (src) {
      els.imagePreview.src = src;
      els.imagePreview.style.display = 'block';
    } else {
      els.imagePreview.src = '';
      els.imagePreview.style.display = 'none';
    }
  }
  updateBgButtonsUI();
}
