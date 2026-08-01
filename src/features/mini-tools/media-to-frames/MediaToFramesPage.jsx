/**
 * Media to Frames Page — Tách GIF hoặc Video thành ảnh từng frame
 * Progressive: extract và hiển thị từng frame ngay khi xong, không chờ toàn bộ
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import RelatedTools from '../shared/RelatedTools';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { decompressFrames, parseGIF } from 'gifuct-js';
import { t } from '../../../i18n/i18n.js';

const ACCENT = '#06b6d4';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Wait for video seeked event with timeout fallback.
 * When currentTime=0, the browser may not fire 'seeked' because it's already at 0.
 */
const waitForSeek = (video, timeout = 500) => {
  return new Promise((resolve) => {
    let resolved = false;
    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    };
    const onTimer = () => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        const check = () => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      }
    };
    video.addEventListener('seeked', onSeeked);
    setTimeout(onTimer, timeout);
  });
};

export default function MediaToFramesPage() {
  const [frames, setFrames] = useState([]); // [{src: DataURL, label: string, selected: bool}]
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(null); // {current, total, label}
  const [error, setError] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null); // {name, type, size}

  const [videoFps, setVideoFps] = useState(2); // frames per second to extract
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);

  const [visibleCount, setVisibleCount] = useState(50); // Lazy rendering count

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Hydrate icons after mount
  useEffect(() => { reloadLucideIcons(); }, []);

  const navigate = (path) => {
    window.location.href = path === '' ? '/' : `/?tool=${path}`;
  };

  const reset = () => {
    // Revoke any old frame data URLs
    frames.forEach(f => { if (f.src?.startsWith('blob:')) URL.revokeObjectURL(f.src); });
    setFrames([]);
    setProgress(null);
    setError(null);
    setSourceInfo(null);
    setVisibleCount(50);
  };

  // ——— GIF Extraction via gifuct-js ———
  const extractGifFrames = async (file) => {
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    const rawFrames = decompressFrames(gif, true);

    setProgress({ current: 0, total: rawFrames.length, label: t('mediaToFrames.status.decodingGif') });

    const w = gif.lsd.width;
    const h = gif.lsd.height;

    // Persistent canvas for compositing
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const extracted = [];
    for (let i = 0; i < rawFrames.length; i++) {
      const f = rawFrames[i];
      try {
        // Draw patch onto persistent canvas
        const imageData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height);
        ctx.putImageData(imageData, f.dims.left, f.dims.top);

        // Snapshot this frame async
        const src = await new Promise(resolve => canvas.toBlob(b => resolve(b ? URL.createObjectURL(b) : ''), 'image/png'));
        if (!src) throw new Error(t('error.toBlobFailed'));
        
        const newFrame = { src, label: `Frame ${i + 1}`, selected: true };
        extracted.push(newFrame);

        // Progressive: push to state after each frame
        setFrames(prev => [...prev, newFrame]);
        setProgress({ current: i + 1, total: rawFrames.length, label: `Frame ${i + 1}/${rawFrames.length}` });
      } catch (err) {
        console.warn(`Lỗi khi tách GIF frame ${i}:`, err);
      }

      // Yield every 3 frames so browser can paint
      if (i % 3 === 0) await yieldToMain();

      // Dispose if needed
      try {
        if (f.disposalType === 2) ctx.clearRect(f.dims.left, f.dims.top, f.dims.width, f.dims.height);
      } catch (e) {}
    }
    return extracted;
  };

  // ——— Video Extraction via <video> + canvas ———
  const extractVideoFrames = async (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.muted = true;

      video.onloadedmetadata = async () => {
        // Fix for Infinity/NaN duration bug in some Chromium/Firefox versions for WebM/MP4
        if (!isFinite(video.duration) || isNaN(video.duration)) {
          video.currentTime = 1e101;
          await waitForSeek(video, 2000);
          video.currentTime = 0;
          await waitForSeek(video, 2000);
        }

        const duration = video.duration;
        const interval = 1 / videoFps;
        const totalFrames = Math.ceil(duration * videoFps);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        setProgress({ current: 0, total: totalFrames, label: `0/${totalFrames} frames` });

        const extracted = [];
        for (let i = 0; i < totalFrames; i++) {
          try {
            const time = i * interval;
            const seekPromise = waitForSeek(video);
            video.currentTime = Math.min(time, duration - 0.01);
            await seekPromise;

            ctx.drawImage(video, 0, 0);
            const src = await new Promise(resolve => canvas.toBlob(b => resolve(b ? URL.createObjectURL(b) : ''), 'image/png'));
            if (!src) throw new Error(t('error.toBlobFailed'));

            const newFrame = { src, label: `t=${time.toFixed(2)}s`, selected: true };
            extracted.push(newFrame);

            setFrames(prev => [...prev, newFrame]);
            setProgress({ current: i + 1, total: totalFrames, label: `${i + 1}/${totalFrames} frames` });
          } catch (err) {
            console.warn(`Lỗi khi tách Video frame ${i}:`, err);
          }

          // Yield every 2 frames so browser paints
          if (i % 2 === 0) await yieldToMain();
        }
        URL.revokeObjectURL(url);
        resolve(extracted);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(t('mediaToFrames.error.readVideo')));
      };
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|avi)$/i);

    if (!isGif && !isVideo) {
      setError(t('mediaToFrames.error.onlyGifVideo'));
      return;
    }


    reset();
    setExtracting(true);
    setError(null);
    setSourceInfo({ name: file.name, type: isGif ? 'GIF' : 'Video', size: file.size });

    try {
      if (isGif) {
        await extractGifFrames(file);
      } else {
        await extractVideoFrames(file);
      }
    } catch (e) {
      setError(t('mediaToFrames.error.extract', e.message || String(e)));
    }

    setExtracting(false);
    setProgress(null);
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();

  const toggleSelect = (i) => {
    setFrames(prev => prev.map((f, idx) => idx === i ? { ...f, selected: !f.selected } : f));
  };
  const selectAll = () => setFrames(prev => prev.map(f => ({ ...f, selected: true })));
  const selectNone = () => setFrames(prev => prev.map(f => ({ ...f, selected: false })));

  const selectedFrames = frames.filter(f => f.selected);
  const ext = format.split('/')[1].replace('jpeg', 'jpg');

  const handleDownload = async () => {
    if (!selectedFrames.length) return;

    if (selectedFrames.length === 1) {
      // Single frame: direct download
      const res = await fetch(selectedFrames[0].src);
      const blob = await res.blob();
      CanvasHelper.downloadBlob(blob, `frame_1.${ext}`);
    } else {
      // Multiple: ZIP with progress
      setProgress({ current: 0, total: selectedFrames.length, label: t('mediaToFrames.status.creatingZip') });
      const zip = new JSZip();
      for (let i = 0; i < selectedFrames.length; i++) {
        const f = selectedFrames[i];
        // Convert DataURL → blob
        const res = await fetch(f.src);
        const blob = await res.blob();
        // Re-encode if needed (format != png)
        let finalBlob = blob;
        if (format !== 'image/png') {
          const img = await CanvasHelper.loadImage(f.src);
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
          finalBlob = await CanvasHelper.toBlob(c, format, quality);
        }
        zip.file(`frame_${String(i + 1).padStart(4, '0')}.${ext}`, finalBlob);
        setProgress({ current: i + 1, total: selectedFrames.length, label: `${i + 1}/${selectedFrames.length}` });
        if (i % 5 === 0) await yieldToMain();
      }
      setProgress({ current: selectedFrames.length, total: selectedFrames.length, label: t('mediaToFrames.status.compressingZip') });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'frames.zip');
      setProgress(null);
    }
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader
        title={t('mediaToFrames.seo.title')}
        description={t('mediaToFrames.seo.desc')}
        schema={{ applicationCategory: 'UtilitiesApplication' }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LucideIcon name="arrow-left" width="16" height="16" /> {t('mediaToFrames.nav.home')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            {t('mediaToFrames.nav.editor')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: `rgba(6,182,212,0.12)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="scissors" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mediaToFrames.badge')}
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 14px 0', letterSpacing: '-0.02em' }}>
            {t('mediaToFrames.title')}
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto' }}>
            {t('mediaToFrames.desc')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LucideIcon name="alert-circle" width="18" height="18" /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: frames.length ? '1fr 320px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Drop zone */}
            {!sourceInfo && (
              <div
                onDrop={handleDrop} onDragOver={handleDragOver}
                onClick={() => fileInputRef.current.click()}
                style={{ background: '#161B22', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minHeight: '300px', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(6,182,212,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = '#161B22'; }}
              >
                <input ref={fileInputRef} type="file" accept="image/gif,video/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(6,182,212,0.12)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LucideIcon name="scissors" width="28" height="28" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: 0 }}>{t('mediaToFrames.drop.title')}</h3>
                <p style={{ fontSize: '14px', color: '#8B949E', margin: 0 }}>{t('mediaToFrames.drop.support')}</p>
                <button className="interact-btn" style={{ background: ACCENT, color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                  {t('mediaToFrames.drop.button')}
                </button>
              </div>
            )}

            {/* Source info */}
            {sourceInfo && (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '14px' }}>{sourceInfo.name}</div>
                  <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '3px' }}>
                    {sourceInfo.type} · {CanvasHelper.formatFileSize(sourceInfo.size)}
                  </div>
                </div>
                <button onClick={() => { reset(); fileInputRef.current.click(); }} style={{ background: 'rgba(6,182,212,0.1)', color: ACCENT, border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                  {t('mediaToFrames.changeFile')}
                </button>
                <input ref={fileInputRef} type="file" accept="image/gif,video/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            )}

            {/* Extraction progress */}
            {(extracting || progress) && (
              <div style={{ background: '#161B22', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '16px 18px' }}>
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

            {/* Frames grid — streams in progressively */}
            {frames.length > 0 && (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#F5F7FA' }}>
                    {frames.length} frames {extracting && <span style={{ color: '#8B949E', fontSize: '13px' }}>{t('mediaToFrames.extractingHint')}</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={selectAll} style={{ background: 'transparent', color: ACCENT, border: `1px solid rgba(6,182,212,0.3)`, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>{t('mediaToFrames.selectAll')}</button>
                    <button onClick={selectNone} style={{ background: 'transparent', color: '#8B949E', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>{t('mediaToFrames.selectNone')}</button>
                  </div>
                </div>
                <div onScroll={(e) => {
                  const { scrollTop, clientHeight, scrollHeight } = e.target;
                  if (scrollHeight - scrollTop <= clientHeight + 200) {
                    if (visibleCount < frames.length) {
                      setVisibleCount(prev => prev + 50);
                    }
                  }
                }} style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                  {frames.slice(0, visibleCount).map((f, i) => (
                    <div
                      key={i}
                      className="anim-fade-in"
                      onClick={() => toggleSelect(i)}
                      style={{ cursor: 'pointer', background: '#0B0F16', border: `2px solid ${f.selected ? ACCENT : 'rgba(255,255,255,0.05)'}`, borderRadius: '10px', padding: '6px', transition: 'border-color 0.15s', position: 'relative' }}
                    >
                      {f.selected && (
                        <div style={{ position: 'absolute', top: 4, right: 4, background: ACCENT, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                          <LucideIcon name="check" width="10" height="10" style={{ color: '#000' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', height: '75px' }}>
                        <img src={f.src} alt={f.label} style={{ maxWidth: '100%', maxHeight: '75px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '4px', textAlign: 'center' }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          {frames.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA', marginBottom: '18px' }}>{t('mediaToFrames.exportOptions')}</div>

                {/* Format */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{t('mediaToFrames.imageFormat')}</div>
                  <div style={{ display: 'flex', gap: '6px', background: '#0B0F16', padding: '5px', borderRadius: '10px' }}>
                    {['image/png', 'image/jpeg', 'image/webp'].map(f => (
                      <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: '8px 4px', borderRadius: '7px', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', background: format === f ? ACCENT : 'transparent', color: format === f ? '#000' : '#8B949E', transition: 'all 0.2s' }}>
                        {{ 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[f]}
                      </button>
                    ))}
                  </div>
                </div>

                {format !== 'image/png' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('mediaToFrames.quality')}</span><span style={{ color: ACCENT }}>{Math.round(quality * 100)}%</span>
                    </div>
                    <input type="range" min="0.5" max="1" step="0.05" value={quality} onChange={e => setQuality(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                  </div>
                )}

                {/* Selected count */}
                <div style={{ background: '#0B0F16', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#8B949E' }}>{t('mediaToFrames.selected')}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: ACCENT }}>{selectedFrames.length}/{frames.length} frames</span>
                </div>

                <button onClick={handleDownload} disabled={!selectedFrames.length || extracting} className="interact-btn"
                  style={{ width: '100%', background: !selectedFrames.length || extracting ? '#374151' : ACCENT, color: !selectedFrames.length || extracting ? '#6b7280' : '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: !selectedFrames.length || extracting ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name="download" width="18" height="18" />
                  {selectedFrames.length > 1 ? t('mediaToFrames.downloadZip', selectedFrames.length) : t('mediaToFrames.downloadImage')}
                </button>
              </div>

              {/* Video FPS hint */}
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '13px', color: '#8B949E', fontWeight: 600, marginBottom: '10px' }}>{t('mediaToFrames.videoFps')}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>
                  <span>{t('mediaToFrames.fpsExtract')}</span><span style={{ color: ACCENT }}>{videoFps} fps</span>
                </div>
                <input type="range" min="1" max="30" value={videoFps} onChange={e => setVideoFps(Number(e.target.value))} disabled={!!sourceInfo} style={{ width: '100%', accentColor: ACCENT, opacity: sourceInfo ? 0.5 : 1, cursor: sourceInfo ? 'not-allowed' : 'pointer' }} />
                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '5px' }}>
                  {sourceInfo ? t('mediaToFrames.reloadForFps') : t('mediaToFrames.videoEstimate', videoFps, 30 * videoFps)}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
        <RelatedTools currentTool="media-to-frames" />
      </div>
    </div>
  );
}