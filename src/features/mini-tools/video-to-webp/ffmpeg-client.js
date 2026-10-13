/**
 * ffmpeg-client — Singleton lazy-load ffmpeg.wasm (single-thread core, CDN).
 * Không cắt video: mọi encode đều giữ nguyên toàn bộ nội dung.
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_VERSION = '0.12.6';
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

let ffmpeg = null;
let loadPromise = null;

export function isEngineLoaded() {
  return !!ffmpeg;
}

/** Tải engine (lần đầu ~30MB từ CDN). onLoadProgress: 0..1 */
export async function loadEngine(onLoadProgress) {
  if (ffmpeg) return ffmpeg;
  if (!loadPromise) {
    loadPromise = (async () => {
      const inst = new FFmpeg();
      const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
      if (onLoadProgress) onLoadProgress(0.4);
      const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');
      if (onLoadProgress) onLoadProgress(0.7);
      await inst.load({ coreURL, wasmURL });
      if (onLoadProgress) onLoadProgress(1);
      ffmpeg = inst;
      return inst;
    })().catch((e) => {
      loadPromise = null;
      throw e;
    });
  }
  return loadPromise;
}

/** Hủy engine đang chạy (dùng cho nút Dừng). Lần convert sau sẽ load lại. */
export async function cancelEngine() {
  if (ffmpeg) {
    try {
      ffmpeg.terminate();
    } catch (_) { /* ignore */ }
  }
  ffmpeg = null;
  loadPromise = null;
}

/**
 * Encode 1 lần thử. Trả về Blob output.
 * onAttemptProgress: 0..1 (dựa trên thời gian encode / duration).
 */
export async function encodeOnce({ inputFile, inName, outName, args, duration, onAttemptProgress, shouldCancel }) {
  const inst = await loadEngine();
  const handler = ({ progress, time }) => {
    if (typeof progress === 'number' && isFinite(progress)) {
      onAttemptProgress && onAttemptProgress(Math.min(1, Math.max(0, progress)));
    } else if (duration && isFinite(duration) && duration > 0 && typeof time === 'number') {
      onAttemptProgress && onAttemptProgress(Math.min(1, Math.max(0, time / (duration * 1000000))));
    }
  };
  inst.on('progress', handler);
  try {
    if (shouldCancel && shouldCancel()) throw new Error('cancelled');
    await inst.writeFile(inName, await fetchFile(inputFile));
    if (shouldCancel && shouldCancel()) throw new Error('cancelled');
    await inst.exec(args);
    if (shouldCancel && shouldCancel()) throw new Error('cancelled');
    const data = await inst.readFile(outName);
    // data: Uint8Array (ffmpeg 0.12)
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    // Copy buffer (readFile memory is reused internally)
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    return copy;
  } finally {
    try { inst.off('progress', handler); } catch (_) { /* ignore */ }
    try { await inst.deleteFile(inName); } catch (_) { /* ignore */ }
    try { await inst.deleteFile(outName); } catch (_) { /* ignore */ }
  }
}

export function extOf(name) {
  const m = /\.[a-z0-9]+$/i.exec(name || '');
  return m ? m[0].toLowerCase() : '.mp4';
}
