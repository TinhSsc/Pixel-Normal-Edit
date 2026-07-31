import { setStatus, setGridSizeParams, resetMaps, pixelMap } from '../../engine/core/state.js';
import { resizeCanvas, fitToScreen } from '../../engine/core/viewport.js';
import { renderPixels } from '../../engine/core/render.js';
import { resetHistory } from '../../engine/core/history.js';
import { setAnimationState, loadFrameToCurrentState } from '../../engine/core/animation-state.js';
import { debouncedSaveWorkspace } from '../../engine/core/tab-manager.js';
import JSZip from 'jszip';
import { parseGIF, decompressFrames } from 'gifuct-js';

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
  // Ensure integer frame dimensions to avoid RangeError from float values
  const frameWidth = Math.floor(img.naturalWidth / numFrames);
  const frameHeight = img.naturalHeight;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');

    // Draw the specific slice of the sprite sheet
    // Use integer source coordinates to avoid sub-pixel bleeding
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
  imageObjects.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

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
  // Ensure integer dimensions to avoid RangeError from float values
  w = Math.floor(w);
  h = Math.floor(h);

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

  debouncedSaveWorkspace();
}

export async function handleGifFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    const rawFrames = decompressFrames(gif, true);

    if (rawFrames.length > 10 || (gif.lsd.width * gif.lsd.height > 1000000)) {
      alert("Cảnh báo: GIF lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý...");
    }

    const frames = [];
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = gif.lsd.width;
    baseCanvas.height = gif.lsd.height;
    const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });

    let previousImageData = null;

    for (let i = 0; i < rawFrames.length; i++) {
      setStatus(`Đang xử lý frame ${i + 1}/${rawFrames.length}...`);
      await new Promise(r => setTimeout(r, 0));

      const frame = rawFrames[i];
      const { dims, patch, disposalType } = frame;

      if (disposalType === 2) {
        previousImageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      }

      if (patch) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = dims.width;
        frameCanvas.height = dims.height;
        const frameCtx = frameCanvas.getContext('2d');
        const imgData = frameCtx.createImageData(dims.width, dims.height);
        imgData.data.set(patch);
        frameCtx.putImageData(imgData, 0, 0);
        baseCtx.drawImage(frameCanvas, dims.left, dims.top);
      }

      const finalImgData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      const data32 = new Uint32Array(finalImgData.data.buffer);

      frames.push({
        id: `frame_${i + 1}`,
        pixelMap: new Uint32Array(data32),
        groupMap: [],
        width: baseCanvas.width,
        height: baseCanvas.height,
        historyState: { undoStack: [], redoStack: [], currentStroke: null }
      });

      if (disposalType === 2 && previousImageData) {
        baseCtx.putImageData(previousImageData, 0, 0);
      } else if (disposalType === 3) {
        // Fallback if needed, often not required for basic gifs
      }
    }

    applyAnimationFrames(frames, baseCanvas.width, baseCanvas.height);
    setStatus(`Đã tải GIF thành công (${frames.length} frames)`);
    document.getElementById('uploadModal').style.display = 'none';
  } catch (err) {
    console.error("GIF Upload Error:", err);
    setStatus(`Lỗi khi đọc GIF: ${err.message}`, true);
  }
}

export async function handleVideoFile(file) {
  try {
    const fpsStr = prompt("Nhập số khung hình trên giây (FPS) muốn tách:", "10");
    if (fpsStr === null) return;
    const fps = parseFloat(fpsStr);
    if (isNaN(fps) || fps <= 0) {
      alert("FPS không hợp lệ.");
      return;
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    // Ensure video has loaded enough data to seek
    await new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.oncanplay = resolve;
      }
    });

    const { duration, videoWidth, videoHeight } = video;
    const totalFrames = Math.floor(duration * fps);

    if (totalFrames > 10 || (videoWidth * videoHeight > 1000000)) {
      alert("Cảnh báo: Video lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý...");
    }

    const frames = [];
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Helper: seek video to a specific time and wait for completion
    const seekTo = (time) => {
      return new Promise((resolve) => {
        let resolved = false;
        const handler = () => {
          if (!resolved) {
            resolved = true;
            video.onseeked = null;
            resolve();
          }
        };
        video.onseeked = handler;
        video.currentTime = time;
        // Fallback: if seeked never fires, resolve after 1s
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            video.onseeked = null;
            resolve();
          }
        }, 1000);
      });
    };

    for (let i = 0; i < totalFrames; i++) {
      setStatus(`Đang tách frame video ${i + 1}/${totalFrames}...`);
      await new Promise(r => setTimeout(r, 0));

      await seekTo(i / fps);

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      const imgData = ctx.getImageData(0, 0, videoWidth, videoHeight);
      const data32 = new Uint32Array(imgData.data.buffer);

      frames.push({
        id: `frame_${i + 1}`,
        pixelMap: new Uint32Array(data32),
        groupMap: [],
        width: videoWidth,
        height: videoHeight,
        historyState: { undoStack: [], redoStack: [], currentStroke: null }
      });
    }

    URL.revokeObjectURL(url);
    applyAnimationFrames(frames, videoWidth, videoHeight);
    setStatus(`Đã tải Video thành công (${frames.length} frames)`);
    document.getElementById('uploadModal').style.display = 'none';
  } catch (err) {
    console.error("Video Upload Error:", err);
    setStatus(`Lỗi khi đọc Video: ${err.message}`, true);
  }
}
