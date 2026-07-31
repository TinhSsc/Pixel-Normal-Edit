/**
 * Rotate Page - Xoay và lật ảnh
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

const ACCENT = '#06b6d4';

export default function RotatePage() {
  const [filesData, setFilesData] = useState([]);
  const [error, setError] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [isApplying, setIsApplying] = useState(false);

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
          warns.push(`File "${file.name}" yêu cầu bật Chế độ Nâng cao để đọc.`);
          continue;
        }
        let src = URL.createObjectURL(file);
        if (advanced) {
          const decodedBlob = await decodeImageWithAdvancedEngine(file);
          src = URL.createObjectURL(decodedBlob);
        }
        const img = await CanvasHelper.loadImage(src);
        if (img.naturalWidth > 8192 || img.naturalHeight > 8192) {
          warns.push(`Cảnh báo: "${file.name}" rất lớn (${img.naturalWidth}x${img.naturalHeight}), có thể gây chậm.`);
        }
        newItems.push({ name: file.name, size: file.size, img, src, canvas: null, resultSrc: null });
      } catch (err) {
        warns.push(err.message);
      }
    }
    if (warns.length) setError(warns.join(' | '));
    else setError(null);
    if (newItems.length) setFilesData(prev => [...prev, ...newItems]);
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => e.preventDefault();

  const applyRotateToImg = (img) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const isRotated = rotation === 90 || rotation === 270;
    const cw = isRotated ? h : w;
    const ch = isRotated ? w : h;
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return c;
  };

  const handleApply = async () => {
    if (filesData.length === 0) return;
    setIsApplying(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 30));
      const updated = await Promise.all(filesData.map(async fd => {
        const canvas = applyRotateToImg(fd.img);
        const blob = await CanvasHelper.toBlob(canvas, 'image/png');
        return { ...fd, canvas, resultSrc: URL.createObjectURL(blob) };
      }));
      setFilesData(updated);
    } catch (err) {
      setError('Lỗi khi áp dụng: ' + err.message);
    }
    setIsApplying(false);
  };

  const handleDownload = async () => {
    const ready = filesData.filter(fd => fd.canvas);
    if (!ready.length) return;
    const ext = format.split('/')[1].replace('jpeg', 'jpg');
    if (ready.length === 1) {
      const blob = await CanvasHelper.toBlob(ready[0].canvas, format, quality);
      CanvasHelper.downloadBlob(blob, `rotated_${ready[0].name.split('.')[0]}.${ext}`);
    } else {
      const zip = new JSZip();
      for (const fd of ready) {
        const blob = await CanvasHelper.toBlob(fd.canvas, format, quality);
        zip.file(`rotated_${fd.name.split('.')[0]}.${ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'rotated_images.zip');
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

  const cssTransform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;
  const hasResults = filesData.some(fd => fd.canvas);

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.rotate.title') || "Xoay và Lật ảnh (Rotate & Flip) trực tuyến | Pixel Normal Edit"}
        description={t('seo.rotate.desc') || "Công cụ xoay ảnh 90 độ, 180 độ, lật ngang, lật dọc (Flip) nhanh chóng trực tiếp trên trình duyệt, không làm giảm chất lượng."}
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
            Pixel Editor
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: `rgba(6,182,212,0.1)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="rotate-cw" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.rotate.title', 'Xoay & Lật ảnh')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Xoay lật ảnh hàng loạt</h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Xoay & lật nhiều ảnh cùng lúc với cùng một thiết lập. Xuất file ZIP khi chọn nhiều ảnh.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE || "alert-circle"} width="20" height="20" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: advancedMode ? `rgba(6,182,212,0.1)` : '#161B22', padding: '8px 16px', borderRadius: '20px', border: advancedMode ? `1px solid rgba(6,182,212,0.3)` : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: ACCENT, cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: advancedMode ? ACCENT : '#8B949E' }}>Chế độ Nâng cao (TIFF, HEIC, RAW...)</span>
          </label>
        </div>

        {filesData.length === 0 ? (
          <div 
            className="anim-fade-in"
            onDrop={handleDrop} onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
            style={{ background: '#161B22', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `rgba(6,182,212,0.05)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(6,182,212,0.1)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD || "upload"} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>Kéo thả ảnh vào đây</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>Chọn nhiều ảnh cùng lúc để xoay hàng loạt</p>
            <button className="interact-btn" style={{ background: ACCENT, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              Chọn ảnh
            </button>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
            
            {/* Grid ảnh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px' }}>
                    Danh sách ảnh ({filesData.length})
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
                    <button onClick={() => fileInputRef.current.click()} className="interact-btn" style={{ background: `rgba(6,182,212,0.1)`, color: ACCENT, border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LucideIcon name="plus" width="14" height="14" /> Thêm ảnh
                    </button>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {filesData.map((fd, i) => (
                    <div key={i} className="anim-fade-in" style={{ background: '#0B0F16', border: `1px solid ${fd.canvas ? `rgba(6,182,212,0.3)` : 'rgba(255,255,255,0.05)'}`, padding: '8px', borderRadius: '10px', position: 'relative' }}>
                      <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', color: 'white', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <LucideIcon name="x" width="12" height="12" />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', minHeight: '90px' }}>
                        <img 
                          src={fd.resultSrc || fd.src} 
                          alt={fd.name} 
                          style={{ maxWidth: '100%', maxHeight: '90px', objectFit: 'contain', transform: fd.resultSrc ? 'none' : cssTransform, transition: 'transform 0.3s' }} 
                        />
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#8B949E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fd.name}>{fd.name}</div>
                      {fd.canvas && <div style={{ fontSize: '9px', color: ACCENT, fontWeight: 600 }}>✓ Đã xử lý</div>}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={clearAll} className="interact-btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="trash-2" width="16" height="16" /> Xóa toàn bộ
              </button>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Xoay (Rotate)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                    {[
                      { label: '↺', val: 270 }, { label: '↻', val: 90 }, { label: '180°', val: 180 }, { label: '0°', val: 0 }
                    ].map(btn => (
                      <button key={btn.val} onClick={() => { setRotation(btn.val); setFilesData(prev => prev.map(f => ({ ...f, canvas: null, resultSrc: null }))); }} className="interact-btn" style={{ background: rotation === btn.val ? `rgba(6,182,212,0.15)` : 'transparent', color: rotation === btn.val ? ACCENT : '#B8C0CC', border: `1px solid ${rotation === btn.val ? ACCENT : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Lật (Flip)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                    <button onClick={() => { setFlipH(!flipH); setFilesData(prev => prev.map(f => ({ ...f, canvas: null, resultSrc: null }))); }} className="interact-btn" style={{ background: flipH ? `rgba(6,182,212,0.1)` : 'transparent', color: flipH ? ACCENT : '#B8C0CC', border: `1px solid ${flipH ? ACCENT : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.2s' }}>
                      ↔ Lật ngang
                    </button>
                    <button onClick={() => { setFlipV(!flipV); setFilesData(prev => prev.map(f => ({ ...f, canvas: null, resultSrc: null }))); }} className="interact-btn" style={{ background: flipV ? `rgba(6,182,212,0.1)` : 'transparent', color: flipV ? ACCENT : '#B8C0CC', border: `1px solid ${flipV ? ACCENT : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.2s' }}>
                      ↕ Lật dọc
                    </button>
                  </div>
                </div>

                <button onClick={handleApply} disabled={isApplying} className="interact-btn" style={{ width: '100%', background: isApplying ? '#374151' : ACCENT, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: isApplying ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name="check-circle" width="18" height="18" />
                  {isApplying ? 'Đang xử lý...' : `Áp dụng cho ${filesData.length} ảnh`}
                </button>
              </div>

              {hasResults && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: `1px solid rgba(6,182,212,0.3)`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: ACCENT }}>Tùy chọn tải về</div>
                  
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
                        <span>Chất lượng</span><span style={{ color: ACCENT }}>{Math.round(quality * 100)}%</span>
                      </div>
                      <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT }} />
                    </div>
                  )}

                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LucideIcon name="download" width="18" height="18" />
                    {filesData.filter(f => f.canvas).length > 1 ? 'Tải file ZIP' : 'Tải về'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.rotate.h2') || "Xoay và Lật hình ảnh siêu tốc"}
          description={t('seo.rotate.p1') || "Đôi khi bạn chụp ảnh bị ngược hoặc bị nghiêng. Đừng lo, công cụ xoay và lật ảnh sẽ giúp bạn sửa lại góc độ chỉ bằng một cú nhấp chuột."}
          features={[
            { title: t('seo.rotate.f1.title') || "Xoay 90°, 180°", desc: t('seo.rotate.f1.desc') || "Xoay trái, xoay phải tự do với thuật toán giữ nguyên điểm ảnh." },
            { title: t('seo.rotate.f2.title') || "Lật gương (Flip)", desc: t('seo.rotate.f2.desc') || "Hỗ trợ lật ngang (Horizontal) hoặc lật dọc (Vertical) cực kỳ dễ dàng." }
          ]}
        />
        <RelatedTools currentTool="rotate" />
      </div>

    </div>
  );
}