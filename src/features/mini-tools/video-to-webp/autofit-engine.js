/**
 * autofit-engine — Tìm cấu hình encode tốt nhất để file ≤ targetMB.
 *
 * NGUYÊN TẮC: KHÔNG CẮT video. Chỉ được:
 *  1. Giảm chất lượng (quality) — ưu tiên đầu tiên
 *  2. Giảm kích thước (scale) — ưu tiên thứ hai
 *  3. Tua nhanh nhẹ (setpts tăng tốc, giữ nguyên toàn bộ nội dung) + giảm fps — cuối cùng
 */
import { encodeOnce, extOf } from './ffmpeg-client.js';

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

/** Probe metadata video bằng <video> (nhanh, không cần ffmpeg). */
export function probeVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    const cleanup = () => URL.revokeObjectURL(url);

    const readDims = () => ({
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
    });

    v.onloadedmetadata = async () => {
      try {
        // Fix duration Infinity/NaN (WebM/MP4) — seek để trình duyệt tính duration thật
        if (!isFinite(v.duration) || isNaN(v.duration)) {
          await new Promise((res) => {
            const to = () => {
              v.removeEventListener('seeked', to);
              res();
            };
            v.addEventListener('seeked', to);
            setTimeout(res, 2000);
            try { v.currentTime = 1e101; } catch (_) { res(); }
          });
        }
        const meta = readDims();
        cleanup();
        if (!meta.width || !meta.height) {
          reject(new Error('Không đọc được kích thước video'));
          return;
        }
        resolve(meta);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };
    v.onerror = () => {
      cleanup();
      reject(new Error('Không đọc được file video'));
    };
    v.src = url;
  });
}

/**
 * Thang degrade cố định 8 bước (best → nhỏ nhất).
 * Thứ tự: quality → kích thước → fps/tốc độ. Không có bước nào cắt nội dung.
 */
export function buildLadder({ srcH, capDim, baseFps, maxSpeed }) {
  const topH = even(Math.min(capDim, srcH));
  const midH = even(Math.max(144, topH * 0.66));
  const lowH = even(Math.max(144, topH * 0.4));
  const dims = [...new Set([topH, midH, lowH])];
  const d0 = dims[0];
  const d1 = dims[1] ?? dims[0];
  const d2 = dims[2] ?? dims[1] ?? dims[0];
  const fpsMid = Math.min(baseFps, 10);
  const topSpeed = Math.min(2, Math.max(1, maxSpeed));

  const raw = [
    { q: 80, dim: d0, fps: baseFps, speed: 1 },
    { q: 62, dim: d0, fps: baseFps, speed: 1 },
    { q: 45, dim: d0, fps: baseFps, speed: 1 },
    { q: 45, dim: d1, fps: baseFps, speed: 1 },
    { q: 35, dim: d1, fps: fpsMid, speed: 1 },
    { q: 35, dim: d2, fps: fpsMid, speed: Math.min(1.25, topSpeed) },
    { q: 28, dim: d2, fps: 8, speed: Math.min(1.5, topSpeed) },
    { q: 20, dim: d2, fps: 8, speed: topSpeed },
  ];
  // Ép speed về giới hạn user cho phép (giữ thứ tự)
  return raw.map((s) => ({ ...s, speed: Math.min(s.speed, topSpeed) }));
}

/** Điểm chất lượng tương đối 0..100 để xếp hạng & gợi ý. */
export function qualityScore(step, top) {
  const q = step.q / 80;
  const d = step.dim / top.dim;
  const f = step.fps / top.fps;
  const s = 1 / step.speed;
  return Math.round((q * 0.45 + d * 0.25 + f * 0.2 + s * 0.1) * 100);
}

function vfFor(step) {
  const parts = [`scale=-2:${step.dim}:flags=lanczos`, `fps=${step.fps}`];
  if (step.speed > 1.001) parts.push(`setpts=PTS/${step.speed}`);
  return parts.join(',');
}

function argsFor(format, step) {
  const vf = vfFor(step);
  if (format === 'webp') {
    return ['-i', '__IN__', '-vf', vf, '-c:v', 'libwebp', '-quality', String(step.q), '-compression_level', '6', '-loop', '0', '-an', '__OUT__'];
  }
  // gif — encoder gif gốc của ffmpeg (single-pass, giữ full nội dung)
  return ['-i', '__IN__', '-vf', vf, '-loop', '0', '-an', '__OUT__'];
}

const MIME = { webp: 'image/webp', gif: 'image/gif' };

// Bytes trên mỗi pixel nguồn (ước lượng lạc quan để chọn điểm bắt đầu ladder).
// Chọn nhỏ để thiên về bắt đầu sớm (giữ chất lượng), có trừ hao 1 bước.
const BPP_EST = { webp: 0.012, gif: 0.09 };

/**
 * Ước lượng bước ladder nên bắt đầu, dựa trên độ dài + kích thước video.
 * Video càng dài/nặng → bắt đầu càng sâu (đỡ tốn lần encode vô ích).
 * Trả về index 0..ladder.length-1.
 */
export function estimateStartIndex({ meta, format, ladder, targetBytes, baseFps }) {
  const dur = isFinite(meta.duration) && meta.duration > 0 ? meta.duration : 5;
  const srcPx = meta.width * meta.height * dur * baseFps;
  const top = ladder[0];
  for (let i = 0; i < ladder.length; i++) {
    const s = ladder[i];
    const est =
      srcPx * BPP_EST[format] *
      Math.pow(s.dim / top.dim, 2) *
      (s.fps / top.fps) *
      (1 / s.speed) *
      Math.pow(s.q / 80, 0.7);
    if (est <= targetBytes) return Math.max(0, i - 1); // trừ hao 1 bước giữ chất lượng
  }
  return ladder.length - 1; // video quá nặng: bắt đầu từ bước nhẹ nhất
}

/** Lý do gợi ý: 'long' | 'big' | 'small' */
export function planReason(meta) {
  const dur = isFinite(meta.duration) ? meta.duration : 0;
  if (dur >= 15) return 'long';
  if (meta.width * meta.height >= 1280 * 720) return 'big';
  return 'small';
}

/**
 * Chạy ladder cho 1 format. Trả về { format, attempts, bestFit, smallest, top }.
 * - attempts: [{step, size}] theo thứ tự đã thử
 * - bestFit: attempt đầu tiên ≤ target (chất lượng cao nhất đạt) hoặc null
 * - smallest: attempt nhẹ nhất (dùng khi không cái nào đạt)
 */
export async function runLadder({ file, meta, format, ladder, targetBytes, startIndex = 0, onAttempt, shouldCancel }) {
  const attempts = [];
  let bestFit = null;
  const skipped = Math.max(0, Math.min(startIndex, ladder.length - 1));
  const inName = `in_${Math.random().toString(36).slice(2)}${extOf(file.name)}`;
  const outExt = format === 'webp' ? '.webp' : '.gif';
  const top = ladder[0];

  for (let i = skipped; i < ladder.length; i++) {
    if (shouldCancel && shouldCancel()) throw new Error('cancelled');
    const step = ladder[i];
    const outName = `out_${Math.random().toString(36).slice(2)}${outExt}`;
    const template = argsFor(format, step);
    const args = template.map((a) => (a === '__IN__' ? inName : a === '__OUT__' ? outName : a));
    onAttempt && onAttempt({ format, index: i, total: ladder.length, step });
    const bytes = await encodeOnce({
      inputFile: file,
      inName,
      outName,
      args,
      duration: meta.duration,
      shouldCancel,
      onAttemptProgress: (p) => { if (onAttempt) onAttempt({ format, index: i, total: ladder.length, step, progress: p }); },
    });
    const size = bytes.length;
    const record = { step, size, score: qualityScore(step, top) };
    attempts.push(record);
    if (onAttempt) onAttempt({ format, index: i, total: ladder.length, step, done: size });
    if (!bestFit && size <= targetBytes) {
      bestFit = { ...record, blob: new Blob([bytes.buffer], { type: MIME[format] }) };
      break; // best-first: dừng ngay khi đạt
    }
    // Giữ bytes của attempt nhẹ nhất để fallback (tránh encode lại)
    record._bytes = bytes;
  }

  let smallest = null;
  if (!bestFit && attempts.length) {
    const min = attempts.reduce((a, b) => (b.size < a.size ? b : a));
    smallest = { ...min, blob: new Blob([min._bytes.buffer], { type: MIME[format] }) };
  }
  attempts.forEach((a) => delete a._bytes);
  return { format, attempts, bestFit, smallest, top, skipped };
}

/**
 * Fit 1 file video về ≤ targetMB cho webp và/hoặc gif, rồi đề xuất phương án tối ưu.
 * Trả về { webp, gif, recommendation: 'webp'|'gif'|null, note }.
 */
export async function autofitFile({ file, meta, config, onAttempt, shouldCancel }) {
  const targetBytes = Math.round(config.targetMB * 1024 * 1024);
  const ladder = buildLadder({ srcH: meta.height, capDim: config.capDim, baseFps: config.baseFps, maxSpeed: config.maxSpeed });
  const want = config.format === 'auto' ? ['webp', 'gif'] : [config.format];

  const results = {};
  for (const fmt of want) {
    const startIndex = estimateStartIndex({ meta, format: fmt, ladder, targetBytes, baseFps: config.baseFps });
    results[fmt] = await runLadder({ file, meta, format: fmt, ladder, targetBytes, startIndex, onAttempt, shouldCancel });
  }

  const pick = (r) => r?.bestFit || null;
  const fitsW = pick(results.webp);
  const fitsG = pick(results.gif);

  let recommendation = null;
  let note = '';
  if (want.length === 1) {
    recommendation = want[0];
    if (!pick(results[want[0]])) {
      note = 'over';
    }
  } else if (fitsW && fitsG) {
    if (config.priority === 'smallest') {
      recommendation = fitsW.size <= fitsG.size ? 'webp' : 'gif';
      note = 'smaller';
    } else if (config.priority === 'sharpest') {
      recommendation = fitsW.score >= fitsG.score ? 'webp' : 'gif';
      note = 'sharper';
    } else {
      // Cân bằng: WebP thường nét + nhẹ; chỉ chọn GIF khi GIF nhẹ hơn hẳn (>15%)
      recommendation = fitsG.size < fitsW.size * 0.85 ? 'gif' : 'webp';
      note = recommendation === 'gif' ? 'smaller' : 'balanced';
    }
  } else if (fitsW || fitsG) {
    recommendation = fitsW ? 'webp' : 'gif';
    note = 'only-fit';
  } else {
    // Không phương án nào đạt: chọn attempt nhẹ nhất gần target nhất
    const sW = results.webp?.smallest;
    const sG = results.gif?.smallest;
    if (sW && sG) recommendation = sW.size <= sG.size ? 'webp' : 'gif';
    else recommendation = sW ? 'webp' : sG ? 'gif' : null;
    note = 'over';
  }

  return { ...results, recommendation, note, targetBytes };
}

/**
 * Vạch kế hoạch riêng cho 1 video ngay khi vừa tải lên (chưa encode):
 * xem độ dài + kích thước để chọn bước khởi đầu cho WebP và GIF.
 */
export function previewPlan(meta, config) {
  const targetBytes = Math.round(config.targetMB * 1024 * 1024);
  const ladder = buildLadder({ srcH: meta.height, capDim: config.capDim, baseFps: config.baseFps, maxSpeed: config.maxSpeed });
  const want = config.format === 'auto' ? ['webp', 'gif'] : [config.format];
  const starts = {};
  for (const fmt of want) {
    starts[fmt] = estimateStartIndex({ meta, format: fmt, ladder, targetBytes, baseFps: config.baseFps });
  }
  return { ladder, starts, reason: planReason(meta), total: ladder.length };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
