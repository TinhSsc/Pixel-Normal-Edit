import { GRID_WIDTH, GRID_HEIGHT, pixelMap } from '../../engine/core/state.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { t } from '../../../../i18n/i18n.js';

function drawFrameToCanvas(frame, canvasCtx, offsetX, offsetY) {
  const imgData = new ImageData(frame.width, frame.height);
  const data32 = new Uint32Array(imgData.data.buffer);
  data32.set(frame.pixelMap);
  canvasCtx.putImageData(imgData, offsetX, offsetY);
}

export function generateSpriteSheetBlob(tab) {
  return new Promise((resolve, reject) => {
    if (!tab || !tab.animation || !tab.animation.frames || tab.animation.frames.length === 0) {
      reject(new Error("Không có dữ liệu ảnh động để xuất."));
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
      drawFrameToCanvas(frame, ctx, idx * w, 0);
    });

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function exportSpriteSheet(tab) {
  generateSpriteSheetBlob(tab).then(blob => {
    const namePrefix = tab.name.replace(/\s+/g, '-') + '-spritesheet';
    saveAs(blob, `${namePrefix}.png`);
  }).catch(err => {
    console.error("Export SpriteSheet Error:", err);
    alert(err.message);
  });
}

export async function generateZipBlob(tab) {
  if (!tab || !tab.animation || !tab.animation.frames || tab.animation.frames.length === 0) {
    throw new Error("Không có dữ liệu ảnh động để xuất.");
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
    
    drawFrameToCanvas(frame, ctx, 0, 0);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    const frameNumber = (i + 1).toString().padStart(3, '0');
    imgFolder.file(`frame_${frameNumber}.png`, blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function exportZip(tab) {
  generateZipBlob(tab).then(blob => {
    const namePrefix = tab.name.replace(/\s+/g, '-');
    saveAs(blob, `${namePrefix}.zip`);
  }).catch(err => {
    console.error("Export ZIP Error:", err);
    alert(err.message);
  });
}
