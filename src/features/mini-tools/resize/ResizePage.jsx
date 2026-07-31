/**
 * Resize Page - Thay đổi kích thước ảnh
 * Giao diện Dark theme, tối giản (Dựa trên HomePage)
 */
import { useState, useRef, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import RelatedTools from '../shared/RelatedTools';
import SEOContentBlock from '../shared/SEOContentBlock';

const PRESETS = [
  { label: '1920×1080', width: 1920, height: 1080 },
  { label: '1280×720',  width: 1280, height: 720 },
  { label: '800×600',   width: 800,  height: 600 },
  { label: '512×512',   width: 512,  height: 512 }
];

const LucideIcon = ({ name, width = 18, height = 18, className = '', style = {} }) => {
  return (
    <span 
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} 
      dangerouslySetInnerHTML={{ __html: `<i data-lucide="${name}" width="${width}" height="${height}" class="${className}"></i>` }} 
    />
  );
};

export default function ResizePage() {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  
  const [canvas, setCanvas] = useState(null);
  const [resizedSrc, setResizedSrc] = useState(null);
  const [error, setError] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  
  // For downloading
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [estimatedSize, setEstimatedSize] = useState(null);

  const fileInputRef = useRef(null);

  const navigate = (path) => { 
    if (path === '') window.location.href = '/';
    else window.location.href = `/?tool=${path}`; 
  };

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error(`Chỉ hỗ trợ file ảnh: ${file.name}`);
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
        
        setImage(img);
        const src = URL.createObjectURL(file);
        setImageSrc(src);
        setOriginalFile(file);
        
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setAspectRatio(img.naturalWidth / img.naturalHeight);
        
        setImageInfo({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
        });
        
        setCanvas(null);
        setResizedSrc(null);
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

  const handleWidthChange = (val) => {
    setWidth(val);
    if (lockRatio && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val) => {
    setHeight(val);
    if (lockRatio && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handlePreset = (preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setLockRatio(false);
  };

  const handleResize = async () => {
    if (!image || !width || !height) return;
    setIsResizing(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 50)); // nhường luồng UI
      
      CanvasHelper.validateCanvasSize(width, height);
      const c = CanvasHelper.drawImageToCanvas(image, width, height);
      setCanvas(c);
      
      const blob = await CanvasHelper.toBlob(c, 'image/png');
      setResizedSrc(URL.createObjectURL(blob));
    } catch (err) {
      setError('Lỗi khi resize: ' + err.message);
    } finally {
      setIsResizing(false);
    }
  };

  // Estimate size for download
  useEffect(() => {
    if (!canvas) return;
    CanvasHelper.toBlob(canvas, format, quality).then(blob => {
      setEstimatedSize(blob ? blob.size : 0);
    }).catch(err => {
      console.error(err);
      setEstimatedSize(0);
    });
  }, [canvas, format, quality]);

  const handleDownload = async () => {
    try {
      if (!canvas) throw new Error('Chưa có ảnh để tải');
      const blob = await CanvasHelper.toBlob(canvas, format, quality);
      const ext = format.split('/')[1].replace('jpeg', 'jpg');
      CanvasHelper.downloadBlob(blob, `resized_${originalFile?.name || 'image.' + ext}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.resize.title') || "Đổi kích thước ảnh (Resize), thay đổi phân giải | Pixel Normal Edit"}
        description={t('seo.resize.desc') || "Công cụ phóng to, thu nhỏ ảnh (Resize), thay đổi độ phân giải Width, Height nhanh chóng trên mọi thiết bị."}
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
            <LucideIcon name={ICONS.ARROW_LEFT || "arrow-left"} width="16" height="16" /> {t('home.nav.home', 'Trang chủ')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Pixel Editor
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="maximize" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.resize.title', 'Resize kích thước')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            Đổi kích thước ảnh chuẩn xác
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Thay đổi độ phân giải (Width, Height) của bức ảnh một cách nhanh chóng. Giữ nguyên tỷ lệ khung hình không làm méo ảnh.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE || "alert-circle"} width="20" height="20" />
            {error}
          </div>
        )}

        {!imageSrc ? (
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD || "upload"} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>Kéo thả ảnh vào đây</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>hoặc click để duyệt file trên thiết bị của bạn</p>
            <button className="interact-btn" style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              Chọn ảnh
            </button>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
            
            {/* Vùng Xem trước ảnh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name="image" width="16" height="16" style={{ color: '#8B949E' }} /> Xem trước {canvas ? 'Kết quả' : 'Ảnh gốc'}
                  </div>
                  {imageInfo && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ fontSize: '13px', color: canvas ? '#ec4899' : '#8B949E', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
                        {canvas ? `${width} × ${height}` : `${imageInfo.width} × ${imageInfo.height}`} px
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat', minHeight: '400px' }}>
                  <img src={resizedSrc || imageSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                </div>
              </div>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                
                {/* Inputs: Width & Height */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px' }}>Chiều Rộng (W)</div>
                    <input 
                      type="number" min="1" value={width} 
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '15px' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                    <LucideIcon name="link" width="16" height="16" style={{ color: lockRatio ? '#ec4899' : '#4b5563', cursor: 'pointer' }} onClick={() => setLockRatio(!lockRatio)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px' }}>Chiều Cao (H)</div>
                    <input 
                      type="number" min="1" value={height} 
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 16px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F7FA', outline: 'none', fontSize: '15px' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }} onClick={() => setLockRatio(!lockRatio)}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${lockRatio ? '#ec4899' : 'rgba(255,255,255,0.2)'}`, background: lockRatio ? '#ec4899' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lockRatio && <LucideIcon name="check" width="12" height="12" style={{ color: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: '14px', color: lockRatio ? '#F5F7FA' : '#8B949E' }}>Giữ nguyên tỷ lệ khung hình</span>
                </div>

                {/* Presets */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Kích thước chuẩn</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {PRESETS.map(p => (
                      <button 
                        key={p.label} 
                        onClick={() => handlePreset(p)}
                        style={{ 
                          padding: '10px 4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', 
                          fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                          background: 'transparent', color: '#8B949E'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.color = '#ec4899'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8B949E'; }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resize Action */}
                <button 
                  onClick={handleResize} disabled={isResizing} className="interact-btn" 
                  style={{ width: '100%', background: isResizing ? '#374151' : '#ec4899', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: isResizing ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <LucideIcon name="maximize" width="18" height="18" className={isResizing ? "spin" : ""} /> 
                  {isResizing ? 'Đang xử lý...' : 'Áp dụng Resize'}
                </button>
              </div>

              {/* Tải về */}
              {canvas && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name="check-circle" width="16" height="16" /> Tùy chọn tải về
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {['image/png', 'image/jpeg', 'image/webp'].map(f => {
                      const label = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[f];
                      return (
                        <button key={f} onClick={() => setFormat(f)} style={{ 
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                          background: format === f ? '#ec4899' : 'transparent',
                          color: format === f ? '#fff' : '#8B949E'
                        }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {format !== 'image/png' && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#B8C0CC', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Chất lượng</span>
                        <span style={{ color: '#ec4899' }}>{Math.round(quality * 100)}%</span>
                      </div>
                      <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#ec4899' }} />
                    </div>
                  )}

                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <LucideIcon name="download" width="18" height="18" /> Tải về {estimatedSize && `(~${CanvasHelper.formatFileSize(estimatedSize)})`}
                  </button>
                </div>
              )}

              <button onClick={() => { setImageSrc(null); setCanvas(null); setResizedSrc(null); }} className="interact-btn" style={{ width: '100%', background: 'transparent', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="refresh-cw" width="16" height="16" /> Chọn ảnh khác
              </button>

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