/**
 * Frames to Media Page — Ghép nhiều ảnh thành GIF hoặc WebM
 * Progressive loading: load dần từng file, hiển thị progress
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import RelatedTools from '../shared/RelatedTools';
import GIF from 'gif.js';
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url';
import { decompressFrames, parseGIF } from 'gifuct-js';

const ACCENT = '#f59e0b';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export default function FramesToMediaPage() {
  const [frames, setFrames] = useState([]); // [{name, src, img, width, height}]
  const [loadProgress, setLoadProgress] = useState(null); // {current, total}
  const [error, setError] = useState(null);

  const [visibleCount, setVisibleCount] = useState(50); // Lazy rendering count

  const [fps, setFps] = useState(5);
  const [maxDim, setMaxDim] = useState(512);
  const [outputType, setOutputType] = useState('gif'); // 'gif' | 'webm'
  const [gifQuality, setGifQuality] = useState(10); // gif.js quality 1–30
  const [videoFps, setVideoFps] = useState(10); // fps khi tách video → frame
  const [lastSourceType, setLastSourceType] = useState(null); // 'gif' | 'video' | null

  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(null); // 0–100
  const [resultSrc, setResultSrc] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultMime, setResultMime] = useState('image/gif');

  const [previewIndex, setPreviewIndex] = useState(0);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  // Hydrate icons after mount
  useEffect(() => { reloadLucideIcons(); }, []);

  const navigate = (path) => {
    window.location.href = path === '' ? '/' : `/?tool=${path}`;
  };

  // — Progressive file loader (ảnh, GIF hoặc Video) —
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const items = Array.from(files);
    setError(null);
    setResultSrc(null);
    if (resultBlob) URL.revokeObjectURL(resultSrc);
    setResultBlob(null);
    setVisibleCount(50);

    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i);
      try {
        if (isGif || isVideo) {
          await loadMediaFrames(file, isGif ? 'gif' : 'video');
        } else if (file.type.startsWith('image/')) {
          setLoadProgress({ current: i + 1, total: items.length, label: `Đang tải "${file.name}"...` });
          const src = URL.createObjectURL(file);
          const img = await CanvasHelper.loadImage(src);
          const frame = { name: file.name, src, img, width: img.naturalWidth, height: img.naturalHeight };
          setFrames(prev => [...prev, frame]);
          await yieldToMain();
        } else {
          setError(`Bỏ qua "${file.name}": chỉ hỗ trợ ảnh, GIF hoặc Video.`);
        }
      } catch (e) {
        setError(`Lỗi "${file.name}": ${e.message}`);
      }
    }
    setLoadProgress(null);
  };

  // — Tách frame từ GIF hoặc Video, thêm từng frame vào danh sách —
  const loadMediaFrames = async (file, kind) => {
    if (kind === 'gif') {
      const buffer = await file.arrayBuffer();
      const gif = parseGIF(buffer);
      const rawFrames = decompressFrames(gif, true);
      setLoadProgress({ current: 0, total: rawFrames.length, label: `Đang tách frame từ "${file.name}"...` });
      const w = gif.lsd.width;
      const h = gif.lsd.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      for (let i = 0; i < rawFrames.length; i++) {
        const f = rawFrames[i];
        try {
          const imageData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height);
          ctx.putImageData(imageData, f.dims.left, f.dims.top);
          const dataUrl = await new Promise(r => canvas.toBlob(b => r(b ? URL.createObjectURL(b) : ''), 'image/png'));
          if (!dataUrl) throw new Error('toBlob failed');
          const img = await CanvasHelper.loadImage(dataUrl);
          setFrames(prev => [...prev, { name: `${file.name} #${i + 1}`, src: dataUrl, img, width: img.naturalWidth, height: img.naturalHeight }]);
          setLoadProgress({ current: i + 1, total: rawFrames.length, label: `Đang tách frame từ "${file.name}"...` });
        } catch(err) {
          console.warn(`Lỗi tách GIF frame ${i}:`, err);
        }
        if (i % 3 === 0) await yieldToMain();
        try {
          if (f.disposalType === 2) ctx.clearRect(f.dims.left, f.dims.top, f.dims.width, f.dims.height);
        } catch(e) {}
      }
    } else {
      setLastSourceType('video');
      await extractVideoFrames(file);
    }
  };

  // — Tách frame từ video qua <video> + canvas —
  const extractVideoFrames = async (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const seekTo = (t) => new Promise((res, rej) => {
        const onSeeked = () => { cleanup(); res(); };
        const onError = () => { cleanup(); rej(new Error('Không thể seek video')); };
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);
        video.currentTime = t;
      });

      video.onloadedmetadata = async () => {
        try {
          if (!isFinite(video.duration) || isNaN(video.duration)) {
            video.currentTime = 1e101;
            await seekTo(1e101).catch(() => {});
            video.currentTime = 0;
            await seekTo(0).catch(() => {});
          }
          const duration = video.duration;
          const interval = 1 / videoFps;
          const totalFrames = Math.ceil(duration * videoFps);
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          setLoadProgress({ current: 0, total: totalFrames, label: `Đang tách frame từ "${file.name}"...` });

          for (let i = 0; i < totalFrames; i++) {
            try {
              const time = Math.min(i * interval, duration - 0.01);
              // Bỏ qua seek nếu đang đứng đúng vị trí (tránh treo khi currentTime == 0)
              if (Math.abs(video.currentTime - time) > 0.001) await seekTo(time);
              ctx.drawImage(video, 0, 0);
              const dataUrl = await new Promise(r => canvas.toBlob(b => r(b ? URL.createObjectURL(b) : ''), 'image/png'));
              if (!dataUrl) throw new Error('toBlob failed');
              const img = await CanvasHelper.loadImage(dataUrl);
              setFrames(prev => [...prev, { name: `${file.name} @${time.toFixed(2)}s`, src: dataUrl, img, width: img.naturalWidth, height: img.naturalHeight }]);
              setLoadProgress({ current: i + 1, total: totalFrames, label: `Đang tách frame từ "${file.name}"...` });
            } catch(err) {
              console.warn(`Lỗi tách Video frame ${i}:`, err);
            }
            if (i % 2 === 0) await yieldToMain();
          }
          URL.revokeObjectURL(url);
          resolve();
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Không đọc được video'));
      };
    });
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => e.preventDefault();

  // — Drag-to-reorder —
  const onDragStart = (i) => setDraggingIdx(i);
  const onDropFrame = (i) => {
    if (draggingIdx === null || draggingIdx === i) return;
    setFrames(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(draggingIdx, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    setDraggingIdx(null);
  };

  const removeFrame = (i) => {
    // Revoke blob URL for the removed frame
    setFrames(prev => {
      const removed = prev[i];
      if (removed?.src) URL.revokeObjectURL(removed.src);
      return prev.filter((_, idx) => idx !== i);
    });
  };
  const moveFrame = (i, dir) => {
    setFrames(prev => {
      const arr = [...prev];
      const to = i + dir;
      if (to < 0 || to >= arr.length) return arr;
      [arr[i], arr[to]] = [arr[to], arr[i]];
      return arr;
    });
  };

  // — Preview animation —
  const startPreview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPreviewIndex(0);
    intervalRef.current = setInterval(() => {
      setPreviewIndex(p => (p + 1) % frames.length);
    }, 1000 / fps);
  };
  const stopPreview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // — Scale image to maxDim —
  const scaleFrame = (img) => {
    const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h);
    return c;
  };

  // — Render GIF (worker-based; gif.js 0.2.0 requires at least 1 worker) —
  const renderGif = () => {
    return new Promise((resolve, reject) => {
      const first = scaleFrame(frames[0].img);
      const gif = new GIF({
        workers: Math.min(2, frames.length),
        quality: gifQuality,
        width: first.width,
        height: first.height,
        workerScript: gifWorkerUrl,
      });

      const delay = Math.round(1000 / fps);
      let i = 0;
      const addNext = async () => {
        if (i >= frames.length) {
          gif.render();
          return;
        }
        const c = scaleFrame(frames[i].img);
        gif.addFrame(c, { delay });
        setRenderProgress(Math.round((i / frames.length) * 60));
        i++;
        await yieldToMain();
        addNext();
      };

      gif.on('progress', p => setRenderProgress(60 + Math.round(p * 40)));
      gif.on('finished', blob => resolve(blob));
      gif.on('error', e => {
        console.warn('gif.js error (fallback to canvas):', e);
        // Fallback: use canvas toDataURL as simple GIF alternative
        try {
          const c = scaleFrame(frames[0].img);
          c.toBlob(b => b ? resolve(b) : reject(e), 'image/gif');
        } catch(fbErr) {
          reject(e);
        }
      });
      addNext();
    });
  };

  // — Render WebM via MediaRecorder —
  const renderWebM = async () => {
    const first = scaleFrame(frames[0].img);
    const canvas = document.createElement('canvas');
    canvas.width = first.width;
    canvas.height = first.height;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    const frameDelay = 1000 / fps;
    for (let i = 0; i < frames.length; i++) {
      const c = scaleFrame(frames[i].img);
      ctx.drawImage(c, 0, 0);
      setRenderProgress(Math.round(((i + 1) / frames.length) * 100));
      await new Promise(r => setTimeout(r, frameDelay));
    }

    recorder.stop();
    await new Promise(r => { recorder.onstop = r; });
    return new Blob(chunks, { type: 'video/webm' });
  };

  const handleRender = async () => {
    if (frames.length < 2) { setError('Cần ít nhất 2 ảnh.'); return; }
    setRendering(true);
    setRenderProgress(0);
    setResultSrc(null);
    if (resultBlob) URL.revokeObjectURL(resultSrc);
    setResultBlob(null);
    setError(null);
    try {
      let blob;
      if (outputType === 'gif') {
        blob = await renderGif();
        setResultMime('image/gif');
      } else {
        blob = await renderWebM();
        setResultMime('video/webm');
      }
      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
    } catch (e) {
      setError('Lỗi render: ' + e.message);
    }
    setRendering(false);
    setRenderProgress(null);
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const ext = outputType === 'gif' ? 'gif' : 'webm';
    CanvasHelper.downloadBlob(resultBlob, `animation.${ext}`);
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader
        title="Ghép ảnh thành GIF / Video, Đổi Video sang GIF | Pixel Normal Edit"
        description="Ghép ảnh PNG, JPG, WebP thành GIF động hoặc WebM. Chuyển Video sang GIF và ngược lại. Hoàn toàn xử lý cục bộ trên trình duyệt."
        schema={{ applicationCategory: 'UtilitiesApplication' }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LucideIcon name="arrow-left" width="16" height="16" /> Trang chủ
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Pixel Editor
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: `rgba(245,158,11,0.12)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="film" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Ghép ảnh thành GIF / Video · Đổi Video ↔ GIF
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 14px 0', letterSpacing: '-0.02em' }}>
            Tạo GIF hoặc WebM từ ảnh, GIF, Video
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
            Upload ảnh, kéo thả GIF hoặc Video — tool tự tách frame, bạn sắp xếp thứ tự, chọn FPS rồi xuất GIF hoặc WebM.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LucideIcon name="alert-circle" width="18" height="18" /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: frames.length ? '1fr 360px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Left: Upload + Frame List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Drop zone (always visible when no frames or as add-more) */}
            <div
              onDrop={handleDrop} onDragOver={handleDragOver}
              onClick={() => fileInputRef.current.click()}
              style={{ background: '#161B22', border: `2px dashed ${frames.length ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '20px', padding: frames.length ? '20px' : '70px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(245,158,11,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = frames.length ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = '#161B22'; }}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => handleFiles(e.target.files)} />
              {frames.length === 0 ? (
                <>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `rgba(245,158,11,0.12)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LucideIcon name="images" width="28" height="28" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F5F7FA', margin: 0 }}>Kéo thả ảnh, GIF hoặc Video vào đây</h3>
                  <p style={{ fontSize: '14px', color: '#8B949E', margin: 0 }}>Chọn nhiều ảnh, hoặc kéo 1 file GIF / MP4 / WebM để tự tách frame</p>
                  <button className="interact-btn" style={{ background: ACCENT, color: '#000', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    Chọn file
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: ACCENT, fontWeight: 600, fontSize: '14px' }}>
                  <LucideIcon name="plus-circle" width="18" height="18" /> Thêm ảnh / GIF / Video nữa (kéo thả hoặc click)
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {loadProgress && (
              <div style={{ background: '#161B22', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: ACCENT, fontWeight: 600 }}>{loadProgress.label || 'Đang tải...'}</span>
                  <span style={{ color: '#8B949E' }}>{loadProgress.current}/{loadProgress.total}</span>
                </div>
                <div style={{ background: '#0B0F16', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: ACCENT, height: '100%', width: `${(loadProgress.current / loadProgress.total) * 100}%`, borderRadius: '6px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Frame Grid */}
            {frames.length > 0 && (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#F5F7FA' }}>Frames ({frames.length})</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={startPreview} className="interact-btn" style={{ background: `rgba(245,158,11,0.1)`, color: ACCENT, border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <LucideIcon name="play" width="12" height="12" /> Preview
                    </button>
                    <button onClick={stopPreview} className="interact-btn" style={{ background: 'transparent', color: '#8B949E', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                      Stop
                    </button>
                    <button onClick={() => {
                      // Revoke all frame blob URLs
                      frames.forEach(f => { if (f.src) URL.revokeObjectURL(f.src); });
                      setFrames([]);
                    }} style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Xóa tất cả
                    </button>
                  </div>
                </div>
                <div onScroll={(e) => {
                  const { scrollTop, clientHeight, scrollHeight } = e.target;
                  if (scrollHeight - scrollTop <= clientHeight + 200) {
                    if (visibleCount < frames.length) {
                      setVisibleCount(prev => prev + 50);
                    }
                  }
                }} style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
                  {frames.slice(0, visibleCount).map((f, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropFrame(i)}
                      className="anim-fade-in"
                      style={{ background: '#0B0F16', border: `2px solid ${previewIndex === i && intervalRef.current ? ACCENT : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '6px', cursor: 'grab', userSelect: 'none', position: 'relative' }}
                    >
                      <button onClick={() => removeFrame(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', color: '#fff', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <LucideIcon name="x" width="10" height="10" />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', height: '80px' }}>
                        <img src={f.src} alt={f.name} style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                        <span style={{ fontSize: '10px', color: '#4b5563', fontWeight: 700 }}>#{i + 1}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={() => moveFrame(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', padding: '1px 3px', fontSize: '11px' }}>◀</button>
                          <button onClick={() => moveFrame(i, 1)} disabled={i === frames.length - 1} style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', padding: '1px 3px', fontSize: '11px' }}>▶</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          {frames.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Preview */}
              {intervalRef.current && (
                <div className="anim-fade-in" style={{ background: '#161B22', borderRadius: '16px', overflow: 'hidden', border: `1px solid rgba(245,158,11,0.2)` }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: ACCENT, fontWeight: 600 }}>
                    Preview ({fps} FPS)
                  </div>
                  <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0F16', minHeight: '160px' }}>
                    <img src={frames[previewIndex]?.src} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px' }} />
                  </div>
                </div>
              )}

              {/* Settings */}
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA', marginBottom: '18px' }}>Thiết lập</div>

                {/* Output type */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Định dạng đầu ra</div>
                  <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '5px', borderRadius: '10px' }}>
                    {['gif', 'webm'].map(type => (
                      <button key={type} onClick={() => setOutputType(type)} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', background: outputType === type ? ACCENT : 'transparent', color: outputType === type ? '#000' : '#8B949E', transition: 'all 0.2s' }}>
                        {type === 'gif' ? 'GIF' : 'WebM Video'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>FPS</span><span style={{ color: ACCENT }}>{fps}</span>
                  </div>
                  <input type="range" min="1" max="30" value={fps} onChange={e => setFps(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563', marginTop: '3px' }}>
                    <span>1 (chậm)</span><span>30 (mượt)</span>
                  </div>
                </div>

                {/* Max dimension */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kích thước tối đa</span><span style={{ color: ACCENT }}>{maxDim}px</span>
                  </div>
                  <input type="range" min="128" max="1920" step="64" value={maxDim} onChange={e => setMaxDim(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                </div>

                {/* Video extract FPS */}
                {lastSourceType === 'video' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>FPS tách video</span><span style={{ color: ACCENT }}>{videoFps}</span>
                    </div>
                    <input type="range" min="1" max="30" value={videoFps} onChange={e => setVideoFps(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>Áp dụng cho video thêm vào lần sau</div>
                  </div>
                )}

                {/* GIF Quality */}
                {outputType === 'gif' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Chất lượng GIF</span><span style={{ color: ACCENT }}>{gifQuality <= 5 ? 'Tốt' : gifQuality <= 15 ? 'Vừa' : 'Nhanh'}</span>
                    </div>
                    <input type="range" min="1" max="30" value={gifQuality} onChange={e => setGifQuality(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>Số càng nhỏ = chất lượng cao hơn nhưng render lâu hơn</div>
                  </div>
                )}

                {/* Render button */}
                <button onClick={handleRender} disabled={rendering || frames.length < 2} className="interact-btn"
                  style={{ width: '100%', background: rendering ? '#374151' : ACCENT, color: rendering ? '#9ca3af' : '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: rendering ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name={rendering ? 'loader' : 'film'} width="18" height="18" className={rendering ? 'spin' : ''} />
                  {rendering ? `Đang tạo ${outputType.toUpperCase()}...` : `Tạo ${outputType.toUpperCase()}`}
                </button>

                {/* Render progress */}
                {rendering && renderProgress !== null && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>
                      <span>Đang xử lý...</span><span style={{ color: ACCENT }}>{renderProgress}%</span>
                    </div>
                    <div style={{ background: '#0B0F16', borderRadius: '6px', height: '6px' }}>
                      <div style={{ background: ACCENT, height: '100%', width: `${renderProgress}%`, borderRadius: '6px', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Result */}
              {resultSrc && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name="check-circle" width="16" height="16" style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 600, color: '#10b981', fontSize: '14px' }}>Hoàn thành!</span>
                    <span style={{ color: '#8B949E', fontSize: '12px', marginLeft: 'auto' }}>
                      {resultBlob && CanvasHelper.formatFileSize(resultBlob.size)}
                    </span>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#0B0F16', minHeight: '140px' }}>
                    {outputType === 'gif'
                      ? <img src={resultSrc} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px' }} />
                      : <video src={resultSrc} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} />}
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <LucideIcon name="download" width="18" height="18" />
                      Tải về {outputType.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
        <RelatedTools currentTool="frames-to-media" />
      </div>
    </div>
  );
}