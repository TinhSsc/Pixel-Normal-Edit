/**
 * Compress Page - Nén ảnh giảm dung lượng
 * Hỗ trợ nhiều file, xuất ZIP
 */
import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
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

const ACCENT = '#10b981';

const COMPRESSION_LEVELS = {
  low:    { maxSizeMB: 2,   maxWidthOrHeight: 1920, useWebWorker: true },
  medium: { maxSizeMB: 1,   maxWidthOrHeight: 1280, useWebWorker: true },
  high:   { maxSizeMB: 0.5, maxWidthOrHeight: 800,  useWebWorker: true },
  custom: null,
};

export default function CompressPage() {
  const [filesData, setFilesData] = useState([]);
  const [error, setError] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  const [level, setLevel] = useState('medium');
  const [customMaxSize, setCustomMaxSize] = useState(1);

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
        let fileForProcess = file;
        if (advanced) {
          const decodedBlob = await decodeImageWithAdvancedEngine(file);
          fileForProcess = new File([decodedBlob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
        }
        const src = URL.createObjectURL(fileForProcess);
        const img = await CanvasHelper.loadImage(src);
        if (img.naturalWidth > 8192 || img.naturalHeight > 8192) {
          warns.push(`Cảnh báo: "${file.name}" rất lớn (${img.naturalWidth}x${img.naturalHeight}), có thể gây chậm.`);
        }
        newItems.push({ file: fileForProcess, name: file.name, origSize: file.size, src, compressedBlob: null, compressedSrc: null });
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

  const handleCompress = async () => {
    if (filesData.length === 0) return;
    setCompressing(true);
    setError(null);
    try {
      const options = level === 'custom'
        ? { maxSizeMB: customMaxSize, useWebWorker: true }
        : COMPRESSION_LEVELS[level];

      const updated = await Promise.all(filesData.map(async fd => {
        const blob = await imageCompression(fd.file, options);
        return { ...fd, compressedBlob: blob, compressedSrc: URL.createObjectURL(blob) };
      }));
      setFilesData(updated);
    } catch (err) {
      setError('Lỗi nén ảnh: ' + err.message);
    }
    setCompressing(false);
  };

  const handleDownload = async () => {
    const ready = filesData.filter(fd => fd.compressedBlob);
    if (!ready.length) return;
    if (ready.length === 1) {
      // Fix 1.5: Use correct extension based on output format, not original extension
      const fd = ready[0];
      // Determine output format: if original was HEIC/HEIF, output is PNG; otherwise keep original
      const isAdvanced = isFileAdvanced(fd.file);
      const ext = (isAdvanced && !fd.file.type.includes('png')) ? 'png' : (fd.name.split('.').pop() || 'png');
      CanvasHelper.downloadBlob(fd.compressedBlob, `compressed.${ext}`);
    } else {
      const zip = new JSZip();
      for (const fd of ready) {
        // Fix 1.5: Use correct extension
        const isAdvanced = isFileAdvanced(fd.file);
        const ext = (isAdvanced && !fd.file.type.includes('png')) ? 'png' : (fd.name.split('.').pop() || 'png');
        const outName = fd.name.replace(/\.[^.]+$/, '') + '_compressed.' + ext;
        zip.file(outName, fd.compressedBlob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'compressed_images.zip');
    }
  };

  const removeFile = (i) => {
    setFilesData(prev => {
      const removed = prev[i];
      if (removed?.src) URL.revokeObjectURL(removed.src);
      if (removed?.compressedSrc) URL.revokeObjectURL(removed.compressedSrc);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const clearAll = () => {
    filesData.forEach(fd => {
      if (fd.src) URL.revokeObjectURL(fd.src);
      if (fd.compressedSrc) URL.revokeObjectURL(fd.compressedSrc);
    });
    setFilesData([]);
  };

  const hasResults = filesData.some(fd => fd.compressedBlob);
  const totalOriginal = filesData.reduce((s, fd) => s + fd.origSize, 0);
  const totalCompressed = filesData.filter(fd => fd.compressedBlob).reduce((s, fd) => s + (fd.compressedBlob?.size || 0), 0);
  const savings = hasResults && totalOriginal ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.compress.title') || "Nén ảnh (Compress) giảm dung lượng trực tuyến | Pixel Normal Edit"}
        description={t('seo.compress.desc') || "Công cụ nén giảm dung lượng ảnh JPG, PNG, WebP tối đa bằng cách tối ưu hóa chi tiết đồ họa. Hoàn toàn miễn phí."}
        schema={{ "applicationCategory": "UtilitiesApplication" }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LucideIcon name={ICONS.ARROW_LEFT} width="16" height="16" /> {t('home.nav.home', 'Trang chủ')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Pixel Editor
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>

        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: `rgba(16,185,129,0.1)`, color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name={ICONS.FILE_ARCHIVE} width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.compress.title', 'Nén ảnh')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Giảm dung lượng ảnh hàng loạt</h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Nén nhiều ảnh cùng lúc với cùng mức độ nén. Xuất file ZIP khi chọn nhiều ảnh. Hoàn toàn xử lý cục bộ trên trình duyệt.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE} width="20" height="20" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: advancedMode ? 'rgba(16,185,129,0.1)' : '#161B22', padding: '8px 16px', borderRadius: '20px', border: advancedMode ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `rgba(16,185,129,0.05)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(16,185,129,0.1)`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>Kéo thả ảnh vào đây</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>Chọn nhiều ảnh cùng lúc để nén hàng loạt</p>
            <button className="interact-btn" style={{ background: ACCENT, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              Chọn ảnh
            </button>
            <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '24px' }}>Hỗ trợ: PNG, JPG, WebP, GIF, BMP</div>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

            {/* Grid ảnh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px' }}>
                    Danh sách ảnh ({filesData.length})
                    {hasResults && <span style={{ color: ACCENT, fontSize: '13px', marginLeft: '12px' }}>-{savings}% dung lượng</span>}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
                    <button onClick={() => fileInputRef.current.click()} className="interact-btn" style={{ background: `rgba(16,185,129,0.1)`, color: ACCENT, border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LucideIcon name="plus" width="14" height="14" /> Thêm ảnh
                    </button>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {filesData.map((fd, i) => {
                    const savingsPct = fd.compressedBlob ? Math.round((1 - fd.compressedBlob.size / fd.origSize) * 100) : null;
                    return (
                      <div key={i} className="anim-fade-in" style={{ background: '#0B0F16', border: `1px solid ${fd.compressedBlob ? `rgba(16,185,129,0.3)` : 'rgba(255,255,255,0.05)'}`, padding: '8px', borderRadius: '10px', position: 'relative' }}>
                        <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', color: 'white', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                          <LucideIcon name="x" width="12" height="12" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '6px', overflow: 'hidden', minHeight: '80px' }}>
                          <img src={fd.compressedSrc || fd.src} alt={fd.name} style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '10px', color: '#8B949E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fd.name}>{fd.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '2px' }}>
                          <span style={{ color: '#4b5563' }}>{CanvasHelper.formatFileSize(fd.origSize)}</span>
                          {savingsPct !== null && <span style={{ color: ACCENT, fontWeight: 600 }}>-{savingsPct}%</span>}
                        </div>
                        {fd.compressedBlob && <div style={{ fontSize: '9px', color: ACCENT }}>{CanvasHelper.formatFileSize(fd.compressedBlob.size)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={clearAll} className="interact-btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="trash-2" width="16" height="16" /> Xóa toàn bộ
              </button>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Mức độ nén</div>
                <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px', marginBottom: '20px' }}>
                  {Object.keys(COMPRESSION_LEVELS).map(k => (
                    <button key={k} onClick={() => setLevel(k)} style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', background: level === k ? ACCENT : 'transparent', color: level === k ? '#fff' : '#8B949E' }}>
                      {{ low: 'Thấp', medium: 'Vừa', high: 'Cao', custom: 'Tùy chỉnh' }[k]}
                    </button>
                  ))}
                </div>

                {level === 'custom' && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px' }}>Dung lượng tối đa (MB)</div>
                    <input type="number" min="0.1" step="0.1" value={customMaxSize} onChange={(e) => setCustomMaxSize(Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '14px' }} />
                  </div>
                )}

                <button onClick={handleCompress} disabled={compressing} className="interact-btn"
                  style={{ width: '100%', background: compressing ? '#374151' : ACCENT, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: compressing ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {compressing
                    ? <><LucideIcon name={ICONS.LOADER} className="spin" width="18" height="18" /> Đang nén...</>
                    : <><LucideIcon name={ICONS.ZAP} width="18" height="18" /> Nén {filesData.length} ảnh ngay</>}
                </button>
              </div>

              {hasResults && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: ACCENT }}>✓ Nén xong — Tiết kiệm {savings}%</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8B949E' }}>
                    <span>Gốc: {CanvasHelper.formatFileSize(totalOriginal)}</span>
                    <span style={{ color: ACCENT }}>Sau nén: {CanvasHelper.formatFileSize(totalCompressed)}</span>
                  </div>
                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LucideIcon name={ICONS.DOWNLOAD} width="18" height="18" />
                    {filesData.filter(f => f.compressedBlob).length > 1 ? 'Tải file ZIP' : 'Tải về'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.compress.h2') || "Tại sao bạn cần công cụ Nén Ảnh?"}
          description={t('seo.compress.p1') || "Tối ưu dung lượng hình ảnh giúp website tải nhanh hơn, tiết kiệm băng thông và thân thiện với SEO."}
          features={[
            { title: t('seo.compress.f1.title') || "Bảo mật 100%", desc: t('seo.compress.f1.desc') || "Không upload file lên cloud, thuật toán nén chạy ngay trên máy tính của bạn." },
            { title: t('seo.compress.f2.title') || "Tuỳ chỉnh linh hoạt", desc: t('seo.compress.f2.desc') || "Cung cấp 3 chế độ nén (Thấp, Vừa, Cao) hoặc tự chỉnh chất lượng từ 0-100%." }
          ]}
          faqs={[
            { q: t('seo.compress.faq1.q') || "Định dạng nào nén tốt nhất?", a: t('seo.compress.faq1.a') || "Định dạng WebP mang lại tỷ lệ nén tốt nhất hiện nay, vượt trội so với JPG và PNG." }
          ]}
        />
        <RelatedTools currentTool="compress" />
      </div>

    </div>
  );
}