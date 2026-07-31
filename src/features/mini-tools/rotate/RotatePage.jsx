/**
 * Rotate Page - Xoay và lật ảnh
 * Giao diện Dark theme, tối giản (Dựa trên HomePage)
 */
import { useState, useRef, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
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

export default function RotatePage() {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  const [canvas, setCanvas] = useState(null);
  const [rotatedSrc, setRotatedSrc] = useState(null);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  
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
        
        setImageInfo({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
        });
        
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setCanvas(null);
        setRotatedSrc(null);
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

  const handleApply = async () => {
    if (!image) return;
    setIsApplying(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 50)); // nhường luồng UI
      
      const w = image.naturalWidth;
      const h = image.naturalHeight;

      const isRotated = rotation === 90 || rotation === 270;
      const canvasW = isRotated ? h : w;
      const canvasH = isRotated ? w : h;

      const c = document.createElement('canvas');
      c.width = canvasW;
      c.height = canvasH;
      const ctx = c.getContext('2d');

      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(image, -w / 2, -h / 2, w, h);

      setCanvas(c);
      
      const blob = await CanvasHelper.toBlob(c, 'image/png');
      setRotatedSrc(URL.createObjectURL(blob));
    } catch (err) {
      setError('Lỗi khi áp dụng: ' + err.message);
    } finally {
      setIsApplying(false);
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
      CanvasHelper.downloadBlob(blob, `rotated_${originalFile?.name || 'image.' + ext}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const cssTransform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.rotate.title') || "Xoay và Lật ảnh (Rotate & Flip) trực tuyến | Pixel Normal Edit"}
        description={t('seo.rotate.desc') || "Công cụ xoay ảnh 90 độ, 180 độ, lật ngang, lật dọc (Flip) nhanh chóng trực tiếp trên trình duyệt, không làm giảm chất lượng."}
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
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="rotate-cw" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.rotate.title', 'Xoay & Lật ảnh')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            Xoay lật ảnh dễ dàng
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Sửa ảnh ngược, lật gương ngang/dọc, xoay theo nhiều góc độ chỉ bằng một cú nhấp chuột.
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD || "upload"} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>Kéo thả ảnh vào đây</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>hoặc click để duyệt file trên thiết bị của bạn</p>
            <button className="interact-btn" style={{ background: '#06b6d4', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
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
                    <LucideIcon name="image" width="16" height="16" style={{ color: '#8B949E' }} /> Xem trước ảnh {canvas && 'kết quả'}
                  </div>
                  {imageInfo && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ fontSize: '13px', color: canvas ? '#06b6d4' : '#8B949E', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
                        {(rotation === 90 || rotation === 270) ? `${imageInfo.height} × ${imageInfo.width}` : `${imageInfo.width} × ${imageInfo.height}`} px
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat', minHeight: '400px', overflow: 'hidden' }}>
                  {canvas ? (
                    <img src={rotatedSrc} alt="Result" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <img src={imageSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transform: cssTransform, transition: 'transform 0.3s ease-out' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                
                {/* Xoay ảnh */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Xoay (Rotate)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <button onClick={() => { setRotation(270); setCanvas(null); }} className="interact-btn" style={{ background: rotation === 270 ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: rotation === 270 ? '#06b6d4' : '#B8C0CC', border: `1px solid ${rotation === 270 ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <LucideIcon name="rotate-ccw" width="18" height="18" />
                    </button>
                    <button onClick={() => { setRotation(90); setCanvas(null); }} className="interact-btn" style={{ background: rotation === 90 ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: rotation === 90 ? '#06b6d4' : '#B8C0CC', border: `1px solid ${rotation === 90 ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <LucideIcon name="rotate-cw" width="18" height="18" />
                    </button>
                    <button onClick={() => { setRotation(180); setCanvas(null); }} className="interact-btn" style={{ background: rotation === 180 ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: rotation === 180 ? '#06b6d4' : '#B8C0CC', border: `1px solid ${rotation === 180 ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                      180°
                    </button>
                    <button onClick={() => { setRotation(0); setCanvas(null); }} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                      Reset
                    </button>
                  </div>
                </div>

                {/* Lật ảnh */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>Lật (Flip)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => { setFlipH(!flipH); setCanvas(null); }} className="interact-btn" style={{ background: flipH ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: flipH ? '#06b6d4' : '#B8C0CC', border: `1px solid ${flipH ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s' }}>
                      <LucideIcon name="move-horizontal" width="16" height="16" /> Lật ngang
                    </button>
                    <button onClick={() => { setFlipV(!flipV); setCanvas(null); }} className="interact-btn" style={{ background: flipV ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: flipV ? '#06b6d4' : '#B8C0CC', border: `1px solid ${flipV ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s' }}>
                      <LucideIcon name="move-vertical" width="16" height="16" /> Lật dọc
                    </button>
                  </div>
                </div>

                {/* Apply Action */}
                <button 
                  onClick={handleApply} disabled={isApplying} className="interact-btn" 
                  style={{ width: '100%', background: isApplying ? '#374151' : '#06b6d4', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: isApplying ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <LucideIcon name="check-circle" width="18" height="18" className={isApplying ? "spin" : ""} /> 
                  {isApplying ? 'Đang xử lý...' : 'Áp dụng Thay đổi'}
                </button>
              </div>

              {/* Tải về */}
              {canvas && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LucideIcon name="check-circle" width="16" height="16" /> Tùy chọn tải về
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {['image/png', 'image/jpeg', 'image/webp'].map(f => {
                      const label = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[f];
                      return (
                        <button key={f} onClick={() => setFormat(f)} style={{ 
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                          background: format === f ? '#06b6d4' : 'transparent',
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
                        <span style={{ color: '#06b6d4' }}>{Math.round(quality * 100)}%</span>
                      </div>
                      <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#06b6d4' }} />
                    </div>
                  )}

                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <LucideIcon name="download" width="18" height="18" /> Tải về {estimatedSize && `(~${CanvasHelper.formatFileSize(estimatedSize)})`}
                  </button>
                </div>
              )}

              <button onClick={() => { setImageSrc(null); setCanvas(null); setRotatedSrc(null); }} className="interact-btn" style={{ width: '100%', background: 'transparent', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="refresh-cw" width="16" height="16" /> Chọn ảnh khác
              </button>

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