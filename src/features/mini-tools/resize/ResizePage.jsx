/**
 * Resize Page - Thay đổi kích thước ảnh
 * Hỗ trợ nhiều file, xuất ZIP
 */
import { useState, useRef, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import RelatedTools from '../shared/RelatedTools';
import SEOContentBlock from '../shared/SEOContentBlock';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FORMAT_REGISTRY } from '../../../shared/image/format-registry.js';
import { decodeImageWithAdvancedEngine } from '../../../shared/image/advanced-engine.js';
import { navigate, validateFile, isFileAdvanced } from '../../../shared/lib/file-utils.js';

const PRESETS = [
  { label: '1920×1080', width: 1920, height: 1080 },
  { label: '1280×720',  width: 1280, height: 720 },
  { label: '800×600',   width: 800,  height: 600 },
  { label: '512×512',   width: 512,  height: 512 }
];

const ACCENT = '#ec4899';

export default function ResizePage() {
  const [filesData, setFilesData] = useState([]);
  const [error, setError] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);

  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [isResizing, setIsResizing] = useState(false);

  const fileInputRef = useRef(null);

  // Hydrate icons after mount
  useEffect(() => { reloadLucideIcons(); }, []);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const newItems = [];
    const warns = [];
    for (const file of Array.from(files)) {
      try {
        validateFile(file);
        const advanced = isFileAdvanced(file);
        if (advanced && !advancedMode) {
          warns.push(t('convert.error.needAdvanced', file.name));
          continue;
        }
        let src = URL.createObjectURL(file);
        if (advanced) {
          const decodedBlob = await decodeImageWithAdvancedEngine(file);
          src = URL.createObjectURL(decodedBlob);
        }
        const img = await CanvasHelper.loadImage(src);
        if (img.naturalWidth > 8192 || img.naturalHeight > 8192) {
          warns.push(t('convert.warning.largeImage', file.name, img.naturalWidth, img.naturalHeight));
        }
        newItems.push({ name: file.name, size: file.size, img, src, canvas: null, resultSrc: null, origW: img.naturalWidth, origH: img.naturalHeight });
      } catch (err) {
        warns.push(err.message);
      }
    }
    if (warns.length) setError(warns.join(' | '));
    else setError(null);
    if (newItems.length) {
      // Set width/height from first file if none yet
      if (filesData.length === 0 && newItems.length > 0) {
        const first = newItems[0];
        setWidth(first.origW);
        setHeight(first.origH);
        setAspectRatio(first.origW / first.origH);
      }
      setFilesData(prev => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => e.preventDefault();

  const handleWidthChange = (val) => {
    setWidth(val);
    if (lockRatio && val > 0) setHeight(Math.round(val / aspectRatio));
  };
  const handleHeightChange = (val) => {
    setHeight(val);
    if (lockRatio && val > 0) setWidth(Math.round(val * aspectRatio));
  };
  const handlePreset = (preset) => { setWidth(preset.width); setHeight(preset.height); setLockRatio(false); };

  const handleResize = async () => {
    if (filesData.length === 0 || !width || !height) return;
    setIsResizing(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 30));
      const updated = await Promise.all(filesData.map(async fd => {
        CanvasHelper.validateCanvasSize(width, height);
        const canvas = CanvasHelper.drawImageToCanvas(fd.img, width, height);
        const blob = await CanvasHelper.toBlob(canvas, 'image/png');
        return { ...fd, canvas, resultSrc: URL.createObjectURL(blob) };
      }));
      setFilesData(updated);
    } catch (err) {
      setError(t('resizePage.error.resize', err.message));
    }
    setIsResizing(false);
  };

  const handleDownload = async () => {
    const ready = filesData.filter(fd => fd.canvas);
    if (!ready.length) return;
    const ext = format.split('/')[1].replace('jpeg', 'jpg');
    if (ready.length === 1) {
      const blob = await CanvasHelper.toBlob(ready[0].canvas, format, quality);
      CanvasHelper.downloadBlob(blob, `resized_${ready[0].name.split('.')[0]}.${ext}`);
    } else {
      const zip = new JSZip();
      for (const fd of ready) {
        const blob = await CanvasHelper.toBlob(fd.canvas, format, quality);
        zip.file(`resized_${fd.name.split('.')[0]}.${ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'resized_images.zip');
    }
  };

  const removeFile = (i) => {
    setFilesData(prev => {
      const removed = prev[i];
      if (removed?.src) URL.revokeObjectURL(removed.src);
      if (removed?.resultSrc) URL.revokeObjectURL(removed.resultSrc);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const clearAll = () => {
    filesData.forEach(fd => {
      if (fd.src) URL.revokeObjectURL(fd.src);
      if (fd.resultSrc) URL.revokeObjectURL(fd.resultSrc);
    });
    setFilesData([]);
  };

  const hasResults = filesData.some(fd => fd.canvas);

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.resize.title') || "Đổi kích thước ảnh (Resize), thay đổi phân giải | Pixel Normal Edit"}
        description={t('seo.resize.desc') || "Công cụ phóng to, thu nhỏ ảnh (Resize), thay đổi độ phân giải Width, Height nhanh chóng trên mọi thiết bị."}
        schema={{ "applicationCategory": "UtilitiesApplication" }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LucideIcon name={ICONS.ARROW_LEFT || "arrow-left"} width="16" height="16" /> {t('home.nav.home', 'Trang chủ')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            {t('resizePage.nav.editor')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>

        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: `rgba(236,72,153,0.1)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="maximize" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.resize.title', 'Resize kích thước')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>{t('resizePage.title')}</h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            {t('resizePage.desc')}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE || "alert-circle"} width="20" height="20" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: advancedMode ? 'rgba(236,72,153,0.1)' : '#161B22', padding: '8px 16px', borderRadius: '20px', border: advancedMode ? '1px solid rgba(236,72,153,0.3)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: ACCENT, cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: advancedMode ? ACCENT : '#8B949E' }}>{t('resizePage.advancedMode')}</span>
          </label>
        </div>

        {filesData.length === 0 ? (
          <div 
            className="anim-fade-in"
            onDrop={handleDrop} onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
            style={{ background: '#161B22', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `rgba(236,72,153,0.05)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(236,72,153,0.1)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD || "upload"} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>{t('resizePage.drop.title')}</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>{t('resizePage.drop.desc')}</p>
            <button className="interact-btn" style={{ background: ACCENT, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              {t('resizePage.drop.button')}
            </button>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

            {/* Grid ảnh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px' }}>{t('resizePage.fileList', filesData.length)}</div>
                  <div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
                    <button onClick={() => fileInputRef.current.click()} className="interact-btn" style={{ background: `rgba(236,72,153,0.1)`, color: ACCENT, border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LucideIcon name="plus" width="14" height="14" /> {t('resizePage.addMore')}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {filesData.map((fd, i) => (
                    <div key={i} className="anim-fade-in" style={{ background: '#0B0F16', border: `1px solid ${fd.canvas ? `rgba(236,72,153,0.3)` : 'rgba(255,255,255,0.05)'}`, padding: '8px', borderRadius: '10px', position: 'relative' }}>
                      <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', color: 'white', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <LucideIcon name="x" width="12" height="12" />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', minHeight: '80px' }}>
                        <img src={fd.resultSrc || fd.src} alt={fd.name} style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#8B949E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fd.name}>{fd.name}</div>
                      <div style={{ fontSize: '9px', color: fd.canvas ? ACCENT : '#4b5563' }}>
                        {fd.canvas ? `✓ ${width}×${height}` : `${fd.origW}×${fd.origH}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={clearAll} className="interact-btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="trash-2" width="16" height="16" /> {t('resizePage.clearAll')}
              </button>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px' }}>{t('resizePage.width')}</div>
                    <input type="number" min="1" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '15px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                    <button onClick={() => setLockRatio(!lockRatio)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <LucideIcon name={lockRatio ? "link" : "link-2-off"} width="18" height="18" style={{ color: lockRatio ? ACCENT : '#4b5563' }} />
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px' }}>{t('resizePage.height')}</div>
                    <input type="number" min="1" value={height} onChange={(e) => handleHeightChange(Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '15px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>{t('resizePage.preset')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                    {PRESETS.map(p => (
                      <button key={p.label} onClick={() => handlePreset(p)} className="interact-btn"
                        style={{ padding: '10px 4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', background: 'transparent', color: '#8B949E', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8B949E'; }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleResize} disabled={isResizing} className="interact-btn"
                  style={{ width: '100%', background: isResizing ? '#374151' : ACCENT, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: isResizing ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name="maximize" width="18" height="18" />
                  {isResizing ? t('resizePage.processing') : t('resizePage.resizeBtn', filesData.length, width, height)}
                </button>
              </div>

              {hasResults && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: `1px solid rgba(236,72,153,0.3)`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: ACCENT }}>{t('resizePage.downloadOptions')}</div>
                  
                  <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px' }}>
                    {['image/png', 'image/jpeg', 'image/webp'].map(f => (
                      <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', background: format === f ? ACCENT : 'transparent', color: format === f ? '#fff' : '#8B949E' }}>
                        {{ 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[f]}
                      </button>
                    ))}
                  </div>

                  {format !== 'image/png' && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#B8C0CC', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('resizePage.quality')}</span><span style={{ color: ACCENT }}>{Math.round(quality * 100)}%</span>
                      </div>
                      <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                    </div>
                  )}

                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LucideIcon name="download" width="18" height="18" />
                    {filesData.filter(f => f.canvas).length > 1 ? t('convert.controls.downloadZip') : t('framesToMedia.download')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.resize.h2') || "Tiện ích Resize kích thước ảnh"}
          description={t('seo.resize.p1') || "Cho dù bạn cần Resize ảnh để đăng Facebook, Instagram, hoặc làm banner quảng cáo, trình thay đổi kích thước của chúng tôi sẽ giúp bạn thao tác chuẩn xác tới từng Pixel."}
          features={[
            { title: t('seo.resize.f1.title') || "Giữ nguyên tỷ lệ", desc: t('seo.resize.f1.desc') || "Bảo toàn Aspect Ratio gốc để ảnh không bị méo lệch sau khi thu phóng." },
            { title: t('seo.resize.f2.title') || "Tuỳ chọn thuật toán", desc: t('seo.resize.f2.desc') || "Hỗ trợ Pixelated (Dành cho Pixel Art) và Smooth (Dành cho ảnh thường)." }
          ]}
        />
        <RelatedTools currentTool="resize" />
      </div>

    </div>
  );
}