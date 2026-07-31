import { initializeImageMagick, ImageMagick, MagickFormat, MagickReadSettings } from '@imagemagick/magick-wasm';
import wasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';

let isInitialized = false;

export const initAdvancedEngine = async () => {
  if (isInitialized) return;
  try {
    const wasmBytes = await fetch(wasmUrl).then(r => r.arrayBuffer());
    await initializeImageMagick(new Uint8Array(wasmBytes));
    isInitialized = true;
  } catch (err) {
    console.error("Lỗi khởi tạo ImageMagick:", err);
    throw new Error("Không thể khởi tạo Chế độ Nâng cao (ImageMagick).");
  }
};

const EXT_TO_MAGICK_FORMAT = {
  'avif': MagickFormat.Avif,
  'heic': MagickFormat.Heic,
  'jxl': MagickFormat.Jxl,
  'tiff': MagickFormat.Tiff,
  'bmp': MagickFormat.Bmp,
  'jp2': MagickFormat.Jp2,
  'jxr': MagickFormat.Jxr,
  'gif': MagickFormat.Gif,
  'jpg': MagickFormat.Jpeg,
  'jpeg': MagickFormat.Jpeg,
  'png': MagickFormat.Png,
  'webp': MagickFormat.WebP,
  'tga': MagickFormat.Tga,
  'ico': MagickFormat.Ico,
  'dds': MagickFormat.Dds
};

export const encodeImageWithAdvancedEngine = async (canvas, ext, quality) => {
  await initAdvancedEngine();

  // ICO format requires dimensions <= 256x256
  if (ext.toLowerCase() === 'ico' && (canvas.width > 256 || canvas.height > 256)) {
    const ratio = Math.min(256 / canvas.width, 256 / canvas.height);
    const newW = Math.floor(canvas.width * ratio);
    const newH = Math.floor(canvas.height * ratio);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newW;
    tempCanvas.height = newH;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0, newW, newH);
    canvas = tempCanvas;
  }

  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const settings = new MagickReadSettings();
  settings.format = MagickFormat.Rgba;
  settings.width = canvas.width;
  settings.height = canvas.height;
  
  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(new Uint8Array(imgData.data.buffer), settings, (image) => {
        const mFormat = EXT_TO_MAGICK_FORMAT[ext.toLowerCase()];
        if (!mFormat) throw new Error("Định dạng không được hỗ trợ bởi Advanced Engine: " + ext);
        
        image.format = mFormat;
        if (quality) image.quality = quality * 100;
        
        image.write(mFormat, (data) => {
          resolve(new Blob([data], { type: `image/${ext}` }));
        });
      });
    } catch(e) {
      reject(e);
    }
  });
};

export const decodeImageWithAdvancedEngine = async (file) => {
  await initAdvancedEngine();
  
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  
  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(data, (image) => {
        // Convert to PNG blob for standard browser usage (drawing to canvas)
        image.write(MagickFormat.Png, (pngData) => {
          const blob = new Blob([pngData], { type: 'image/png' });
          resolve(blob);
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};
