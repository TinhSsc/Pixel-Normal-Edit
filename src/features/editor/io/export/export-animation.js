import { GRID_WIDTH, GRID_HEIGHT, pixelMap } from '../../engine/core/state.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { t } from '../../../../i18n/i18n.js';

function drawFrameToCanvas(frame, canvasCtx, offsetX, offsetY, options = { transparent: true }) {
  if (!options.transparent) {
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(offsetX, offsetY, frame.width, frame.height);
  }

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = frame.width;
  frameCanvas.height = frame.height;
  const frameCtx = frameCanvas.getContext('2d');

  if (frame.layers && frame.layers.length > 0) {
    frame.layers.forEach(layer => {
      if (layer.visible === false) return;
      const imgData = new ImageData(frame.width, frame.height);
      const data32 = new Uint32Array(imgData.data.buffer);
      data32.set(layer.pixelMap);
      
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = frame.width;
      layerCanvas.height = frame.height;
      layerCanvas.getContext('2d').putImageData(imgData, 0, 0);
      
      frameCtx.drawImage(layerCanvas, 0, 0);
    });
  } else if (frame.pixelMap) {
    const imgData = new ImageData(frame.width, frame.height);
    const data32 = new Uint32Array(imgData.data.buffer);
    data32.set(frame.pixelMap);
    frameCtx.putImageData(imgData, 0, 0);
  }

  canvasCtx.drawImage(frameCanvas, offsetX, offsetY);
}

export function generateSpriteSheetBlob(tab, options = { transparent: true }) {
  return new Promise((resolve, reject) => {
    if (!tab || !tab.animation || !tab.animation.frames || tab.animation.frames.length === 0) {
      reject(new Error(t('exportAnim.noData')));
      return;
    }

    const frames = tab.animation.frames;
    const w = frames[0].width;
    const h = frames[0].height;

    const canvas = document.createElement('canvas');
    canvas.width = w * frames.length;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    frames.forEach((frame, idx) => {
      drawFrameToCanvas(frame, ctx, idx * w, 0, options);
    });

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function exportSpriteSheet(tab, options = { transparent: true }) {
  generateSpriteSheetBlob(tab, options).then(blob => {
    const namePrefix = tab.name.replace(/\s+/g, '-') + '-spritesheet';
    saveAs(blob, `${namePrefix}.png`);
  }).catch(err => {
    console.error("Export SpriteSheet Error:", err);
    alert(err.message);
  });
}

export async function generateZipBlob(tab, options = { transparent: true }) {
  if (!tab || !tab.animation || !tab.animation.frames || tab.animation.frames.length === 0) {
    throw new Error(t('exportAnim.noData'));
  }

  const zip = new JSZip();
  const frames = tab.animation.frames;
  const namePrefix = tab.name.replace(/\s+/g, '-');
  
  const imgFolder = zip.folder(namePrefix);

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    
    drawFrameToCanvas(frame, ctx, 0, 0, options);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    const frameNumber = (i + 1).toString().padStart(3, '0');
    imgFolder.file(`frame_${frameNumber}.png`, blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function exportZip(tab, options = { transparent: true }) {
  generateZipBlob(tab, options).then(blob => {
    const namePrefix = tab.name.replace(/\s+/g, '-');
    saveAs(blob, `${namePrefix}.zip`);
  }).catch(err => {
    console.error("Export ZIP Error:", err);
    alert(err.message);
  });
}

export function exportAnimation(tab, format, options = { transparent: true }) {
  return new Promise((resolve, reject) => {
    if (!tab || !tab.animation || !tab.animation.frames || tab.animation.frames.length === 0) {
      return reject(new Error(t('exportAnim.noData')));
    }

    if (format === 'gif') {
      import('gifenc').then(({ GIFEncoder, quantize, applyPalette }) => {
        try {
          const frames = tab.animation.frames;
          const fps = tab.animation.fps || 12;
          const frameDuration = Math.round(1000 / fps);
          const w = frames[0].width;
          const h = frames[0].height;

          const gif = GIFEncoder();
          
          for (let i = 0; i < frames.length; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            
            drawFrameToCanvas(frames[i], ctx, 0, 0, options);
            const imgData = ctx.getImageData(0, 0, w, h);
            
            const format = options.transparent ? 'rgba4444' : 'rgb565';
            const palette = quantize(imgData.data, 256, { format });
            const index = applyPalette(imgData.data, palette, format);
            
            gif.writeFrame(index, w, h, { palette, delay: frameDuration, transparent: options.transparent });
          }

          gif.finish();
          const buffer = gif.bytes();
          resolve(new Blob([buffer], { type: 'image/gif' }));
        } catch (err) {
          reject(new Error(t('exportAnim.gifError', err.message)));
        }
      }).catch(err => {
        reject(new Error(t('exportAnim.loadGifLibError', err.message)));
      });
      return;
    }

    if (format === 'webm') {
      const frames = tab.animation.frames;
      const fps = tab.animation.fps || 12;
      const frameDuration = 1000 / fps;
      const w = frames[0].width;
      const h = frames[0].height;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.start();

      let frameIdx = 0;
      const drawNext = () => {
        if (frameIdx >= frames.length) {
          setTimeout(() => recorder.stop(), 50); // Small delay to capture last frame
          return;
        }

        ctx.clearRect(0, 0, w, h);
        drawFrameToCanvas(frames[frameIdx], ctx, 0, 0, options);
        frameIdx++;

        setTimeout(drawNext, frameDuration);
      };

      drawNext();
    } else {
      reject(new Error(t('exportAnim.unsupportedFormat')));
    }
  });
}
