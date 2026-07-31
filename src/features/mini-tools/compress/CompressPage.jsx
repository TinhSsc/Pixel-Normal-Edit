/**
 * Compress Page - Nén ảnh giảm dung lượng
 * Giao diện Dark theme, tối giản (Dựa trên HomePage)
 */
import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import RelatedTools from '../shared/RelatedTools';
import SEOContentBlock from '../shared/SEOContentBlock';

const LucideIcon = ({ name, width = 18, height = 18, className = '', style = {} }) => {
  return (
    <span 
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} 
      dangerouslySetInnerHTML={{ __html: `<i data-lucide="${name}" width="${width}" height="${height}" class="${className}"></i>` }} 
    />
  );
};

export default function CompressPage() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalSrc, setOriginalSrc] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedSrc, setCompressedSrc] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    reloadLucideIcons();
  }); // call on every render is fine or specific deps

  const navigate = (path) => { 
    if (path === '') window.location.href = '/';
    else window.location.href = `/?tool=${path}`; 
  };

  const compressionLevels = {
    low:      { maxSizeMB: 2,    maxWidthOrHeight: 1920, useWebWorker: true },
    medium:   { maxSizeMB: 1,    maxWidthOrHeight: 1280, useWebWorker: true },
    high:     { maxSizeMB: 0.5,  maxWidthOrHeight: 800,  useWebWorker: true },
    custom:   null,
  };

  const [level, setLevel] = useState('medium');
  const [customMaxSize, setCustomMaxSize] = useState(1);

  const validateFile = (file) => {
    const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp',
                             'image/gif', 'image/bmp', 'image/svg+xml',
                             'image/heic', 'image/heif'];
    if (!SUPPORTED_TYPES.includes(file.type) &&
        !file.name.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg|heic|heif)$/i)) {
      throw new Error(`File không được hỗ trợ: ${file.name}`);
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File quá lớn (tối đa 50MB): ${file.name}`);
    }
    return true;
  };

  const handleFiles = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      try {
        validateFile(file);
        const img = await CanvasHelper.loadImage(URL.createObjectURL(file));
        if (img.naturalWidth > 4096 || img.naturalHeight > 4096) {
          throw new Error(`Ảnh quá lớn (tối đa 4096px): ${img.naturalWidth}x${img.naturalHeight}`);
        }
        setOriginalFile(file);
        setOriginalSrc(URL.createObjectURL(file));
        setCompressedBlob(null);
        setCompressedSrc(null);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleCompress = async () => {
    if (!originalFile) return;

    setCompressing(true);
    setError(null);

    try {
      const options = level === 'custom'
        ? { maxSizeMB: customMaxSize, useWebWorker: true }
        : compressionLevels[level];

      const blob = await imageCompression(originalFile, options);
      setCompressedBlob(blob);
      setCompressedSrc(URL.createObjectURL(blob));
    } catch (err) {
      setError('Lỗi nén ảnh: ' + err.message);
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    CanvasHelper.downloadBlob(compressedBlob, `compressed.${originalFile.name.split('.').pop()}`);
  };

  const savings = compressedBlob && originalFile
    ? Math.round((1 - compressedBlob.size / originalFile.size) * 100)
    : 0;

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.compress.title') || "Nén ảnh (Compress) giảm dung lượng trực tuyến | Pixel Normal Edit"}
        description={t('seo.compress.desc') || "Công cụ nén giảm dung lượng ảnh JPG, PNG, WebP tối đa bằng cách tối ưu hóa chi tiết đồ họa, giúp tiết kiệm không gian lưu trữ. Hoàn toàn miễn phí."}
        schema={{ "applicationCategory": "UtilitiesApplication" }}
      />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11, 15, 22, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: '#3b82f6' }}>.</span></h1>
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

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name={ICONS.FILE_ARCHIVE} width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.compress.title', 'Nén ảnh')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            Giảm dung lượng ảnh tối đa
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Nén file ảnh bằng cách tối ưu hóa chi tiết đồ họa, giúp giảm mạnh dung lượng lưu trữ trong khi vẫn duy trì mức chất lượng thị giác phù hợp nhất. Hoàn toàn xử lý cục bộ trên trình duyệt.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE} width="20" height="20" />
            {error}
          </div>
        )}

        {!originalSrc ? (
          <div 
            className="anim-fade-in"
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
            style={{
              background: '#161B22', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px', padding: '80px 40px',
              textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '300px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>Kéo thả ảnh vào đây</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>hoặc click để duyệt file trên thiết bị của bạn</p>
            <button className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              Chọn ảnh
            </button>
            <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '24px' }}>Hỗ trợ: PNG, JPG, WebP (Tối đa 50MB)</div>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Control Panel */}
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Mức độ nén</div>
                <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {Object.keys(compressionLevels).map(k => (
                    <button key={k} onClick={() => setLevel(k)} style={{ 
                      flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                      background: level === k ? '#3b82f6' : 'transparent',
                      color: level === k ? '#fff' : '#8B949E'
                    }}>
                      {{ low: 'Thấp', medium: 'Vừa', high: 'Cao', custom: 'Tùy chỉnh' }[k]}
                    </button>
                  ))}
                </div>
              </div>

              {level === 'custom' && (
                <div style={{ flex: '1 1 150px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Dung lượng tối đa (MB)</div>
                  <input type="number" min="0.1" step="0.1" value={customMaxSize} onChange={(e) => setCustomMaxSize(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '14px' }} />
                </div>
              )}

              <div style={{ flex: '1 1 auto', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={handleCompress} disabled={compressing} className="interact-btn" style={{ 
                  background: compressing ? '#374151' : '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: compressing ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px', justifyContent: 'center'
                }}>
                  {compressing ? <><LucideIcon name={ICONS.LOADER} className="spin" width="18" height="18" /> Đang nén...</> : <><LucideIcon name={ICONS.ZAP} width="18" height="18" /> Nén ngay</>}
                </button>
                
                {compressedBlob && (
                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name={ICONS.DOWNLOAD} width="18" height="18" />
                    Tải về
                  </button>
                )}
              </div>
            </div>

            {/* Preview Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name={ICONS.IMAGE} width="16" height="16" style={{ color: '#8B949E' }} /> Ảnh gốc
                  </div>
                  <div style={{ fontSize: '13px', color: '#8B949E', fontFamily: 'monospace', background: '#0B0F16', padding: '4px 10px', borderRadius: '6px' }}>
                    {CanvasHelper.formatFileSize(originalFile?.size || 0)}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat' }}>
                  <img src={originalSrc} alt="Original" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                </div>
              </div>

              {compressedSrc && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#10b981', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LucideIcon name={ICONS.CHECK_CIRCLE} width="16" height="16" /> Đã nén (-{savings}%)
                    </div>
                    <div style={{ fontSize: '13px', color: '#10b981', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                      {CanvasHelper.formatFileSize(compressedBlob?.size || 0)}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat' }}>
                    <img src={compressedSrc} alt="Compressed" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => { setOriginalSrc(null); setCompressedBlob(null); }} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <LucideIcon name={ICONS.REFRESH_CW} width="16" height="16" /> Nén ảnh khác
              </button>
            </div>
          </div>
        )}

      </main>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.compress.h2') || "Tại sao bạn cần công cụ Nén Ảnh?"}
          description={t('seo.compress.p1') || "Tối ưu dung lượng hình ảnh giúp website tải nhanh hơn, tiết kiệm băng thông và thân thiện với SEO. Trình nén ảnh của Pixel Normal Edit sử dụng thuật toán nén thông minh trực tiếp trên trình duyệt."}
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