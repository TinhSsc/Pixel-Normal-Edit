import { setStatus, setGridSizeParams, resetMaps, pixelMap } from '../../engine/core/state.js';
import { resizeCanvas, fitToScreen } from '../../engine/core/viewport.js';
import { renderPixels } from '../../engine/core/render.js';
import { resetHistory } from '../../engine/core/history.js';
import { setAnimationState, loadFrameToCurrentState } from '../../engine/core/animation-state.js';
import JSZip from 'jszip';

export async function handleZipFile(file) {
  try {
    const zip = await JSZip.loadAsync(file);
    const frames = [];
    
    // Tìm và sort các file PNG
    const pngFiles = Object.keys(zip.files)
      .filter(filename => filename.endsWith('.png') && !zip.files[filename].dir)
      .sort();

    if (pngFiles.length === 0) {
      throw new Error("Không tìm thấy file .png nào trong ZIP.");
    }

    let frameWidth = 0, frameHeight = 0;

    for (let i = 0; i < pngFiles.length; i++) {
      const filename = pngFiles[i];
      const blob = await zip.files[filename].async('blob');
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      if (i === 0) {
        frameWidth = img.naturalWidth;
        frameHeight = img.naturalHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, frameWidth, frameHeight);
      
      const imgData = ctx.getImageData(0, 0, frameWidth, frameHeight);
      const data32 = new Uint32Array(imgData.data.buffer);
      
      frames.push({
        id: `frame_${i + 1}`,
        pixelMap: data32,
        groupMap: [],
        width: frameWidth,
        height: frameHeight,
        historyState: { undoStack: [], redoStack: [], currentStroke: null }
      });
      
      URL.revokeObjectURL(url);
    }

    applyAnimationFrames(frames, frameWidth, frameHeight);
    setStatus(`Đã tải ZIP thành công (${frames.length} frames)`);
    document.getElementById('uploadModal').style.display = 'none';
  } catch (err) {
    console.error("ZIP Upload Error:", err);
    setStatus(`Lỗi khi đọc ZIP: ${err.message}`, true);
  }
}

export function handleSpriteSheet(img, numFrames) {
  const frameWidth = img.naturalWidth / numFrames;
  const frameHeight = img.naturalHeight;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the specific slice of the sprite sheet
    ctx.drawImage(img, i * frameWidth, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
    
    const imgData = ctx.getImageData(0, 0, frameWidth, frameHeight);
    const data32 = new Uint32Array(imgData.data.buffer);
    
    frames.push({
      id: `frame_${i + 1}`,
      pixelMap: data32,
      groupMap: [],
      width: frameWidth,
      height: frameHeight,
      historyState: { undoStack: [], redoStack: [], currentStroke: null }
    });
  }

  applyAnimationFrames(frames, frameWidth, frameHeight);
  setStatus(`Đã tải Sprite Sheet thành công (${numFrames} frames)`);
  document.getElementById('uploadModal').style.display = 'none';
}

export function handleMultipleImageFrames(imageObjects) {
  if (!imageObjects || imageObjects.length === 0) return;
  
  // Sort theo natural order tên file (ví dụ frame-2 đứng trước frame-10)
  imageObjects.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

  const frames = [];
  const w = imageObjects[0].img.naturalWidth;
  const h = imageObjects[0].img.naturalHeight;

  for (let i = 0; i < imageObjects.length; i++) {
    const { img } = imageObjects[i];
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    
    const imgData = ctx.getImageData(0, 0, w, h);
    frames.push({
      id: `frame_${i + 1}`,
      pixelMap: new Uint32Array(imgData.data.buffer),
      groupMap: [],
      width: w,
      height: h,
      historyState: { undoStack: [], redoStack: [], currentStroke: null }
    });
  }

  applyAnimationFrames(frames, w, h);
}

function applyAnimationFrames(frames, w, h) {
  // 1. Setup the main canvas to match frame size
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const newCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  const newData = newCtx.getImageData(0, 0, w, h);
  const newData32 = new Uint32Array(newData.data.buffer);
  
  setGridSizeParams(w, h, newData, newData32);
  
  import('../../engine/actions/grid-size-select.js').then(module => {
    module.syncGridSizeUI(w, h);
  });
  
  // 2. Set animation state
  setAnimationState({
    frames,
    activeFrameIndex: 0,
    isAnimationMode: true,
    showOnionSkin: false
  });
  
  // 3. Load frame 0 to current canvas
  loadFrameToCurrentState(0);
  
  // 4. Update UI
  resizeCanvas();
  fitToScreen();
  renderPixels();
}
