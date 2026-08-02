/**
 * GifSimplify Page — Đơn giản hóa GIF / Tua nhanh video
 * Giữ lại 1 trong mỗi N frame (mặc định 2 = bỏ xen kẽ), xuất GIF nhẹ hơn
 * hoặc WebM chạy nhanh hơn. Hoàn toàn xử lý cục bộ trên trình duyệt.
 */
import { useState, useRef, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import RelatedTools from '../shared/RelatedTools';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import GIF from 'gif.js';
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url';
import { decompressFrames, parseGIF } from 'gifuct-js';

const ACCENT = '#a855f7';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export default function GifSimplifyPage() {
  const [frames, setFrames] = useState([]); // [{ src: DataURL, label }]
  const [visibleCount, setVisibleCount] = useState(50);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(null); // {current, total, label}
  const [error, setError] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null); // {name, type, size}

  const [step, setStep] = useState(2); // giữ 1 trong mỗi N frame
  const [videoFps, setVideoFps] = useState(8); // fps khi tách video
  const [fps, setFps] = useState(10); // fps của file đầu ra
  const [maxDim, setMaxDim] = useState(512);
  const [outputType, setOutputType] = useState('gif'); // 'gif' | 'webm'
  const [gifQuality, setGifQuality] = useState(10); // gif.js quality 1–30

  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(null);
  const [resultSrc, setResultSrc] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  const fileInputRef = useRef(null);

  const navigate = (path) => {
    window.location.href = path === '' ? '/' : `/?tool=${path}`;
  };

  useEffect(() => {
    reloadLucideIcons();
  }, []);

  // ——— GIF extraction via gifuct-js ———
  const extractGifFrames = async (file) => {
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    const rawFrames = decompressFrames(gif, true);

    setProgress({ current: 0, total: rawFrames.length, label: t('mediaToFrames.status.decodingGif') });

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
        const src = await new Promise(r => canvas.toBlob(b => r(b ? URL.createObjectURL(b) : ''), 'image/png'));
        if (!src) throw new Error(t('error.toBlobFailed'));
        setFrames(prev => [...prev, { src, label: `Frame ${i + 1}` }]);
        setProgress({ current: i + 1, total: rawFrames.length, label: `Frame ${i + 1}/${rawFrames.length}` });
      } catch(err) {
        console.warn(`Lỗi tách GIF frame ${i}:`, err);
      }
      if (i % 3 === 0) await yieldToMain();
      try {
        if (f.disposalType === 2) ctx.clearRect(f.dims.left, f.dims.top, f.dims.width, f.dims.height);
      } catch(e) {}
    }
  };

  // ——— Video extraction via <video> + canvas ———
  const extractVideoFrames = async (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.opacity = '0.01';
      video.style.pointerEvents = 'none';
      video.style.width = '10px';
      video.style.height = '10px';
      video.style.zIndex = '-9999';
      document.body.appendChild(video);
      
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');

      const seekTo = (t) => new Promise((res, rej) => {
        let isDone = false;
        const cleanup = () => {
          if (isDone) return;
          isDone = true;
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        const onSeeked = () => { cleanup(); res(); };
        const onError = () => { cleanup(); rej(new Error(t('error.videoSeek'))); };
        
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);
        
        // Timeout fallback
        setTimeout(() => {
          if (!isDone) {
            cleanup();
            res(); // Resolve anyway to avoid hanging
          }
        }, 1000);

        video.currentTime = t;
      });

      video.onloadedmetadata = async () => {
        try {
          try {
            await video.play();
            video.pause();
          } catch (err) {}
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

          setProgress({ current: 0, total: totalFrames, label: `0/${totalFrames}` });

          for (let i = 0; i < totalFrames; i++) {
            try {
              const time = Math.min(i * interval, duration - 0.01);
              // Bỏ qua seek nếu đang đứng đúng vị trí (tránh treo khi currentTime == 0)
              if (Math.abs(video.currentTime - time) > 0.001) {
                let playAttempt = video.play();
                if (playAttempt !== undefined) playAttempt.catch(() => {});
                await seekTo(time);
              }
              // Draw before pause
              ctx.drawImage(video, 0, 0);
              if (Math.abs(video.currentTime - time) > 0.001) {
                video.pause();
              }
              const src = await new Promise(r => canvas.toBlob(b => r(b ? URL.createObjectURL(b) : ''), 'image/png'));
              if (!src) throw new Error(t('error.toBlobFailed'));
              setFrames(prev => [...prev, { src, label: `t=${time.toFixed(2)}s` }]);
              setProgress({ current: i + 1, total: totalFrames, label: `${i + 1}/${totalFrames}` });
            } catch(err) {
              console.warn(`Lỗi tách Video frame ${i}:`, err);
            }
            if (i % 2 === 0) await yieldToMain();
          }
          if (video.parentNode) video.parentNode.removeChild(video);
          URL.revokeObjectURL(url);
          resolve();
        } catch(err) {
          if (video.parentNode) video.parentNode.removeChild(video);
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      video.onerror = () => {
        if (video.parentNode) video.parentNode.removeChild(video);
        URL.revokeObjectURL(url);
        reject(new Error(t('error.videoLoad')));
      };
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i);
    if (!isGif && !isVideo) {
      setError(t('mediaToFrames.error.onlyGifVideo'));
      return;
    }

    frames.forEach(f => { if (f.src?.startsWith('blob:')) URL.revokeObjectURL(f.src); });
    setFrames([]);
    setVisibleCount(50);
    setProgress(null);
    setError(null);
    setResultSrc(null);
    setResultBlob(null);
    setSourceInfo({ name: file.name, type: isGif ? 'GIF' : 'Video', size: file.size });
    setExtracting(true);

    try {
      if (isGif) await extractGifFrames(file);
      else await extractVideoFrames(file);
    } catch (e) {
      setError(t('mediaToFrames.error.extract', e.message || String(e)));
    }

    setExtracting(false);
    setProgress(null);
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();

  // ——— Render helpers ———
  const scaleFrame = (img) => {
    const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h);
    return c;
  };

  const loadImages = async (keep) => {
    const imgs = [];
    for (const f of keep) imgs.push(await CanvasHelper.loadImage(f.src));
    return imgs;
  };

  const renderGif = async (keep) => {
    const imgs = await loadImages(keep);
    const first = scaleFrame(imgs[0]);
    return new Promise((resolve, reject) => {
      const gif = new GIF({
        workers: Math.min(2, keep.length),
        quality: gifQuality,
        width: first.width,
        height: first.height,
        workerScript: gifWorkerUrl,
      });

      const delay = Math.round(1000 / fps);
      let i = 0;
      const addNext = async () => {
        if (i >= keep.length) {
          gif.render();
          return;
        }
        const c = scaleFrame(imgs[i]);
        gif.addFrame(c, { delay });
        setRenderProgress(Math.round((i / keep.length) * 60));
        i++;
        await yieldToMain();
        addNext();
      };

      gif.on('progress', p => setRenderProgress(60 + Math.round(p * 40)));
      gif.on('finished', blob => resolve(blob));
      gif.on('error', reject);
      addNext();
    });
  };

  const renderWebM = async (keep) => {
    const imgs = await loadImages(keep);
    const first = scaleFrame(imgs[0]);
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
    for (let i = 0; i < keep.length; i++) {
      const c = scaleFrame(imgs[i]);
      ctx.drawImage(c, 0, 0);
      setRenderProgress(Math.round(((i + 1) / keep.length) * 100));
      await new Promise(r => setTimeout(r, frameDelay));
    }

    recorder.stop();
    await new Promise(r => { recorder.onstop = r; });
    return new Blob(chunks, { type: 'video/webm' });
  };

  const handleRender = async () => {
    if (frames.length < 2) { setError(t('gifSimplify.error.minFrames')); return; }
    const keep = frames.filter((_, i) => i % step === 0);
    if (keep.length === 0) { setError(t('gifSimplify.error.noFramesLeft')); return; }

    setRendering(true);
    setRenderProgress(0);
    setResultSrc(null);
    setResultBlob(null);
    setError(null);
    try {
      const blob = outputType === 'gif' ? await renderGif(keep) : await renderWebM(keep);
      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
    } catch (e) {
      setError(t('gifSimplify.error.render', e.message));
    }
    setRendering(false);
    setRenderProgress(null);
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const ext = outputType === 'gif' ? 'gif' : 'webm';
    CanvasHelper.downloadBlob(resultBlob, `simplified_${(sourceInfo?.name || 'media').split('.')[0]}.${ext}`);
  };

  const keptCount = frames.filter((_, i) => i % step === 0).length;

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader
        title={t('gifSimplify.seo.title')}
        description={t('gifSimplify.seo.desc')}
        schema={{ applicationCategory: 'UtilitiesApplication' }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LucideIcon name="arrow-left" width="16" height="16" /> {t('gifSimplify.nav.home')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            {t('gifSimplify.nav.editor')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: `rgba(168,85,247,0.12)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="timer" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('gifSimplify.title')}
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 14px 0', letterSpacing: '-0.02em' }}>
            {t('gifSimplify.heading')}
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
            {t('gifSimplify.desc')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LucideIcon name="alert-circle" width="18" height="18" /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: frames.length ? '1fr 360px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Left: upload + frame list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {!sourceInfo && (
              <div
                onDrop={handleDrop} onDragOver={handleDragOver}
                onClick={() => fileInputRef.current.click()}
                style={{ background: '#161B22', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minHeight: '300px', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(168,85,247,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = '#161B22'; }}
              >
                <input ref={fileInputRef} type="file" accept="image/gif,video/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(168,85,247,0.12)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LucideIcon name="timer" width="28" height="28" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: 0 }}>{t('gifSimplify.drop.title')}</h3>
                <p style={{ fontSize: '14px', color: '#8B949E', margin: 0 }}>{t('gifSimplify.drop.support')}</p>
                <button className="interact-btn" style={{ background: ACCENT, color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                  {t('gifSimplify.drop.button')}
                </button>
              </div>
            )}

            {sourceInfo && (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '14px' }}>{sourceInfo.name}</div>
                  <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '3px' }}>
                    {sourceInfo.type} · {CanvasHelper.formatFileSize(sourceInfo.size)}
                  </div>
                </div>
                <button onClick={() => { setFrames([]); setSourceInfo(null); setResultSrc(null); setResultBlob(null); fileInputRef.current.click(); }} style={{ background: 'rgba(168,85,247,0.1)', color: ACCENT, border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                  {t('gifSimplify.changeFile')}
                </button>
                <input ref={fileInputRef} type="file" accept="image/gif,video/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            )}

            {(extracting || progress) && (
              <div style={{ background: '#161B22', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: ACCENT, fontWeight: 600 }}>
                    {extracting ? t('mediaToFrames.extracting') : t('mediaToFrames.processing')}
                  </span>
                  <span style={{ color: '#8B949E' }}>{progress?.label}</span>
                </div>
                {progress?.total > 0 && (
                  <div style={{ background: '#0B0F16', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ background: ACCENT, height: '100%', width: `${(progress.current / progress.total) * 100}%`, borderRadius: '6px', transition: 'width 0.15s' }} />
                  </div>
                )}
              </div>
            )}

            {/* Frame grid */}
            {frames.length > 0 && (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#F5F7FA' }}>
                    {frames.length} frames
                    <span style={{ color: ACCENT, marginLeft: '10px', fontSize: '13px' }}>{t('gifSimplify.keepCount', keptCount, frames.length - keptCount)}</span>
                  </span>
                </div>
                <div 
                  onScroll={(e) => {
                    const { scrollTop, clientHeight, scrollHeight } = e.target;
                    if (scrollHeight - scrollTop <= clientHeight + 200) {
                      if (visibleCount < frames.length) {
                        setVisibleCount(prev => prev + 50);
                      }
                    }
                  }}
                  style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}
                >
                  {frames.slice(0, visibleCount).map((f, i) => {
                    const kept = i % step === 0;
                    return (
                      <div key={i} className="anim-fade-in" style={{ background: '#0B0F16', border: `2px solid ${kept ? ACCENT : 'rgba(255,255,255,0.05)'}`, borderRadius: '10px', padding: '6px', opacity: kept ? 1 : 0.35, position: 'relative' }}>
                        {kept && (
                          <div style={{ position: 'absolute', top: 4, right: 4, background: ACCENT, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                            <LucideIcon name="check" width="10" height="10" style={{ color: '#000' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', height: '75px' }}>
                          <img src={f.src} alt={f.label} style={{ maxWidth: '100%', maxHeight: '75px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '4px', textAlign: 'center' }}>{f.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: controls */}
          {frames.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA', marginBottom: '18px' }}>{t('gifSimplify.frameSettings')}</div>

                {/* Step */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('gifSimplify.keepEvery')}</span><span style={{ color: ACCENT }}>{step} {t('gifSimplify.frames')}</span>
                  </div>
                  <input type="range" min="2" max="10" step="1" value={step} onChange={e => setStep(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563', marginTop: '3px' }}>
                    <span>{t('gifSimplify.x2Light')}</span><span>{t('gifSimplify.x10Fast')}</span>
                  </div>
                </div>

                {/* Output type */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{t('framesToMedia.outputFormat')}</div>
                  <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '5px', borderRadius: '10px' }}>
                    {['gif', 'webm'].map(type => (
                      <button key={type} onClick={() => setOutputType(type)} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', background: outputType === type ? ACCENT : 'transparent', color: outputType === type ? '#000' : '#8B949E', transition: 'all 0.2s' }}>
                        {type === 'gif' ? 'GIF' : t('gifSimplify.webmVideo')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('gifSimplify.outputFps')}</span><span style={{ color: ACCENT }}>{fps}</span>
                  </div>
                  <input type="range" min="1" max="30" value={fps} onChange={e => setFps(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                </div>

                {/* Max dimension */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('gifSimplify.maxDim')}</span><span style={{ color: ACCENT }}>{maxDim}px</span>
                  </div>
                  <input type="range" min="128" max="1920" step="64" value={maxDim} onChange={e => setMaxDim(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                </div>

                {/* GIF quality */}
                {outputType === 'gif' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('gifSimplify.gifQuality')}</span><span style={{ color: ACCENT }}>{gifQuality <= 5 ? t('gifSimplify.good') : gifQuality <= 15 ? t('gifSimplify.medium') : t('gifSimplify.fast')}</span>
                    </div>
                    <input type="range" min="1" max="30" value={gifQuality} onChange={e => setGifQuality(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                  </div>
                )}

                {/* Video extract fps */}
                {sourceInfo?.type === 'Video' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('gifSimplify.videoExtractFps')}</span><span style={{ color: ACCENT }}>{videoFps}</span>
                    </div>
                    <input type="range" min="1" max="30" value={videoFps} onChange={e => setVideoFps(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                  </div>
                )}

                {/* Render button */}
                <button onClick={handleRender} disabled={rendering || frames.length < 2} className="interact-btn"
                  style={{ width: '100%', background: rendering ? '#374151' : ACCENT, color: rendering ? '#9ca3af' : '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: rendering ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name={rendering ? 'loader' : 'zap'} width="18" height="18" className={rendering ? 'spin' : ''} />
                  {rendering ? t('gifSimplify.creating', outputType.toUpperCase()) : t('gifSimplify.reduceFrames', frames.length, keptCount)}
                </button>

                {/* Render progress */}
                {rendering && renderProgress !== null && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>
                      <span>{t('gifSimplify.processing')}</span><span style={{ color: ACCENT }}>{renderProgress}%</span>
                    </div>
                    <div style={{ background: '#0B0F16', borderRadius: '6px', height: '6px' }}>
                      <div style={{ background: ACCENT, height: '100%', width: `${renderProgress}%`, borderRadius: '6px', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Result */}
              {resultSrc && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: `1px solid rgba(168,85,247,0.3)`, borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name="check-circle" width="16" height="16" style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 600, color: '#10b981', fontSize: '14px' }}>{t('gifSimplify.completed')}</span>
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
                      {t('gifSimplify.download', outputType.toUpperCase())}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
        <RelatedTools currentTool="gif-simplify" />
      </div>
    </div>
  );
}
