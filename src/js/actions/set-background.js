import { els, setStatus } from '../core/state.js';

import { t } from '../lang/i18n.js';



let bgImage = null;



export function getBgImage() { return bgImage; }



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

    const canvas = document.getElementById('pixelCanvas');
    if (!canvas) return;

    canvas.style.setProperty('--bg-url', `url("${src}")`);
    canvas.classList.add('has-bg');
    setStatus(t('status.bgOn'));
    // Reset so same file can be picked again
    fileInput.value = '';
  };

  els.setBgBtn.onclick = () => {

    const canvas = document.getElementById('pixelCanvas');
    if (!canvas) return;

    if (!bgImage) {
      // No image yet — open file picker
      fileInput.click();
      return;
    }

    // Toggle background on canvas
    const hasBg = canvas.classList.contains('has-bg');

    if (hasBg) {

      canvas.classList.remove('has-bg');

      canvas.style.removeProperty('--bg-url');

      setStatus(t('status.bgOff'));

    } else {

      canvas.style.setProperty('--bg-url', `url("${bgImage}")`);

      canvas.classList.add('has-bg');

      setStatus(t('status.bgOn'));

    }

  };

}



export function setSourceImage(src) {

  bgImage = src;

  if (els.imagePreview) {

    els.imagePreview.src = src;

    els.imagePreview.style.display = 'block';

  }

}
