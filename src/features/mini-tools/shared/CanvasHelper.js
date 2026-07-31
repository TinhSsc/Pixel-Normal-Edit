/**
 * Helper xử lý Canvas dùng chung cho Convert, Resize, Compress
 */
export const CanvasHelper = {
  /**
   * Load ảnh từ URL
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không thể đọc file ảnh'));
      img.src = src;
    });
  },

  /**
   * Vẽ ảnh lên canvas
   */
  drawImageToCanvas(img, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width || img.naturalWidth;
    canvas.height = height || img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  },

  /**
   * Export canvas ra blob
   */
  toBlob(canvas, type = 'image/png', quality = 0.92) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  },

  /**
   * Export canvas ra data URL
   */
  toDataURL(canvas, type = 'image/png', quality = 0.92) {
    return canvas.toDataURL(type, quality);
  },

  /**
   * Download blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  /**
   * Kiểm tra giới hạn canvas
   */
  validateCanvasSize(width, height) {
    const MAX_CANVAS = 16384; // WebGL limit
    const MAX_PIXELS = 268435456; // ~268M pixels

    if (width > MAX_CANVAS || height > MAX_CANVAS) {
      throw new Error(`Kích thước ảnh vượt quá giới hạn (tối đa ${MAX_CANVAS}px)`);
    }
    if (width * height > MAX_PIXELS) {
      throw new Error(`Ảnh có quá nhiều pixels (tối đa ${MAX_PIXELS.toLocaleString()} pixels)`);
    }
    return true;
  }
};