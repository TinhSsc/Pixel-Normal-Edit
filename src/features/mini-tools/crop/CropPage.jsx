/**
 * Crop Page - Cắt ảnh
 * Dùng react-easy-crop
 * Giao diện Dark theme, tối giản (Dựa trên HomePage)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import RelatedTools from '../shared/RelatedTools';
import SEOContentBlock from '../shared/SEOContentBlock';
import { FORMAT_REGISTRY } from '../../../shared/image/format-registry.js';
import { decodeImageWithAdvancedEngine } from '../../../shared/image/advanced-engine.js';
import { navigate, validateFile, isFileAdvanced } from '../../../shared/lib/file-utils.js';

export default function CropPage() {
  const [imageSrc, setImageSrc] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1); // default to 1 instead of NaN
  
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [exportFormat, setExportFormat] = useState('image/png');
  const [exportQuality, setExportQuality] = useState(90);
  const [croppedFileSize, setCroppedFileSize] = useState(0);
  
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [croppedSrc, setCroppedSrc] = useState(null);
  const [error, setError] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const croppedAreaPixelsRef = useRef(null);
  const fileInputRef = useRef(null);
  const manualInputRef = useRef(false);
  const typingTimer = useRef(null);

  // Hydrate icons after mount
  useEffect(() => { 
    reloadLucideIcons(); 
    const onPaste = (e) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [advancedMode, croppedSrc, imageSrc]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
    if (!manualInputRef.current) {
      setCropWidth(Math.round(croppedAreaPixels.width));
      setCropHeight(Math.round(croppedAreaPixels.height));
    }
  }, []);

  const handleFiles = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      try {
        validateFile(file);
        const advanced = isFileAdvanced(file);
        if (advanced && !advancedMode) {
          setError(`File "${file.name}" yêu cầu bật Chế độ Nâng cao để đọc.`);
          return;
        }
        let src = URL.createObjectURL(file);
        if (advanced) {
          const decodedBlob = await decodeImageWithAdvancedEngine(file);
          src = URL.createObjectURL(decodedBlob);
        }
        
        // Strip EXIF
        src = await CanvasHelper.normalizeAndTransformImage(src, 0, false, false);
        
        const img = await CanvasHelper.loadImage(src);
        setOriginalSize({ width: img.width, height: img.height });
        setCropWidth(img.width);
        setCropHeight(img.height);
        setAspect(img.width / img.height);
        
        setOriginalFile(file);
        setImageSrc(src);
        setCroppedCanvas(null);
        // Revoke old cropped src
        if (croppedSrc) URL.revokeObjectURL(croppedSrc);
        setCroppedSrc(null);
        setZoom(1);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleTransform = async (rot, fx, fy) => {
    if (!imageSrc) return;
    setIsCropping(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 50));
      const newSrc = await CanvasHelper.normalizeAndTransformImage(imageSrc, rot, fx, fy);
      const img = await CanvasHelper.loadImage(newSrc);
      
      if (imageSrc && !imageSrc.startsWith('data:')) {
         URL.revokeObjectURL(imageSrc);
      }
      
      setOriginalSize({ width: img.width, height: img.height });
      setCropWidth(img.width);
      setCropHeight(img.height);
      setImageSrc(newSrc);
      setAspect(img.width / img.height);
    } catch(err) {
      setError(err.message);
    } finally {
      setIsCropping(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixelsRef.current) return;
    
    setIsCropping(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 50));
      
      const image = await CanvasHelper.loadImage(imageSrc);
      const { x, y } = croppedAreaPixelsRef.current;
      
      const width = manualInputRef.current ? cropWidth : croppedAreaPixelsRef.current.width;
      const height = manualInputRef.current ? cropHeight : croppedAreaPixelsRef.current.height;
      
      const safeX = Math.max(0, Math.min(x, originalSize.width - width));
      const safeY = Math.max(0, Math.min(y, originalSize.height - height));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, safeX, safeY, width, height, 0, 0, width, height);
      setCroppedCanvas(canvas);
      
      const blob = await CanvasHelper.toBlob(canvas, exportFormat, exportQuality / 100);
      setCroppedFileSize(blob.size);
      setCroppedSrc(URL.createObjectURL(blob));
      
    } catch (err) {
      setError('Lỗi khi cắt ảnh: ' + err.message);
    } finally {
      setIsCropping(false);
    }
  };

  const handleDownload = async () => {
    if (!croppedCanvas) return;
    const blob = await CanvasHelper.toBlob(croppedCanvas, exportFormat, exportQuality / 100);
    const ext = exportFormat.split('/')[1];
    const baseName = originalFile?.name?.split('.')[0] || 'cropped_image';
    CanvasHelper.downloadBlob(blob, `${baseName}_cropped.${ext}`);
  };

  const handleReset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (croppedSrc) URL.revokeObjectURL(croppedSrc);
    setImageSrc(null);
    setCroppedCanvas(null);
    setCroppedSrc(null);
    setOriginalFile(null);
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.crop.title') || "Cắt ảnh trực tuyến (Crop Image) - Chuẩn xác, dễ dùng | Pixel Normal Edit"}
        description={t('seo.crop.desc') || "Công cụ cắt ảnh (Crop) trực tuyến miễn phí. Hỗ trợ cắt tự do, cắt theo tỷ lệ 16:9, 1:1, 4:3 nhanh chóng."}
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
            {t('cropPage.nav.editor')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="crop" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.crop.title', 'Cắt ảnh')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            {t('cropPage.title')}
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            {t('cropPage.desc')}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE || "alert-circle"} width="20" height="20" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: advancedMode ? 'rgba(139,92,246,0.1)' : '#161B22', padding: '8px 16px', borderRadius: '20px', border: advancedMode ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: advancedMode ? '#8b5cf6' : '#8B949E' }}>{t('cropPage.advancedMode')}</span>
          </label>
        </div>

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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#161B22'; }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD || "upload"} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>{t('cropPage.drop.title')}</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>{t('cropPage.drop.desc')}</p>
            <button className="interact-btn" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              {t('cropPage.drop.button')}
            </button>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
            
            {/* Vùng Cropper */}
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '500px', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={Number.isFinite(aspect) && aspect > 0 ? aspect : 1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div style={{ padding: '16px 24px', background: 'rgba(11, 15, 22, 0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <LucideIcon name="zoom-in" width="18" height="18" style={{ color: '#8B949E' }} />
                <input 
                  type="range" min={1} max={3} step={0.1} value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Bảng điều khiển */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                
                {/* Tỷ lệ */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>{t('cropPage.ratio')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { label: t('cropPage.original'), value: originalSize.width && originalSize.height ? originalSize.width / originalSize.height : 1 },
                      { label: '1:1', value: 1 / 1 },
                      { label: '4:3', value: 4 / 3 },
                      { label: '16:9', value: 16 / 9 },
                      { label: '9:16', value: 9 / 16 },
                      { label: '3:2', value: 3 / 2 },
                      { label: '2:3', value: 2 / 3 },
                      { label: '4:5', value: 4 / 5 },
                      { label: '3:4', value: 3 / 4 },
                      { label: '5:7', value: 5 / 7 },
                    ].map(a => (
                      <button 
                        key={a.label} 
                        onClick={() => {
                          setAspect(a.value);
                          manualInputRef.current = false;
                        }}
                        style={{ 
                          padding: '10px 4px', borderRadius: '8px', border: '1px solid', 
                          fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                          background: Math.abs(aspect - a.value) < 0.01 ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                          borderColor: Math.abs(aspect - a.value) < 0.01 ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                          color: Math.abs(aspect - a.value) < 0.01 ? '#8b5cf6' : '#8B949E'
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kích thước & Export */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC' }}>{t('cropPage.cropSizeTitle')}</div>
                    <div style={{ fontSize: '12px', color: '#8B949E' }}>{t('cropPage.original')}: {originalSize.width} x {originalSize.height}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>{t('cropPage.width')}</label>
                      <input 
                        type="number" 
                        value={cropWidth} 
                        onChange={(e) => {
                          manualInputRef.current = true;
                          let val = parseInt(e.target.value) || 0;
                          val = Math.min(Math.max(val, 1), originalSize.width);
                          setCropWidth(val);
                          setAspect(val / cropHeight);
                          clearTimeout(typingTimer.current);
                          typingTimer.current = setTimeout(() => { manualInputRef.current = false; }, 2000);
                        }}
                        style={{ width: '100%', background: '#0B0F16', color: '#F5F7FA', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>{t('cropPage.height')}</label>
                      <input 
                        type="number" 
                        value={cropHeight} 
                        onChange={(e) => {
                          manualInputRef.current = true;
                          let val = parseInt(e.target.value) || 0;
                          val = Math.min(Math.max(val, 1), originalSize.height);
                          setCropHeight(val);
                          setAspect(cropWidth / val);
                          clearTimeout(typingTimer.current);
                          typingTimer.current = setTimeout(() => { manualInputRef.current = false; }, 2000);
                        }}
                        style={{ width: '100%', background: '#0B0F16', color: '#F5F7FA', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>{t('cropPage.format')}</label>
                      <select 
                        value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}
                        style={{ width: '100%', background: '#0B0F16', color: '#F5F7FA', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      >
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: (exportFormat === 'image/png') ? '#4b5563' : '#8B949E', marginBottom: '6px' }}>{t('cropPage.qualityLabel', exportQuality)}</label>
                      <input 
                        type="range" min="1" max="100" value={exportQuality} onChange={(e) => setExportQuality(Number(e.target.value))}
                        disabled={exportFormat === 'image/png'}
                        style={{ width: '100%', accentColor: '#8b5cf6', marginTop: '8px', opacity: exportFormat === 'image/png' ? 0.3 : 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Xoay & Lật ảnh */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>{t('cropPage.transformTitle')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => handleTransform(-90, false, false)} className="interact-btn" style={{ background: '#0B0F16', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                      <LucideIcon name="rotate-ccw" width="16" height="16" />
                    </button>
                    <button onClick={() => handleTransform(90, false, false)} className="interact-btn" style={{ background: '#0B0F16', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                      <LucideIcon name="rotate-cw" width="16" height="16" />
                    </button>
                    <button onClick={() => handleTransform(0, true, false)} className="interact-btn" style={{ background: '#0B0F16', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
                      <LucideIcon name="flip-horizontal" width="16" height="16" /> {t('transform.flipH')}
                    </button>
                    <button onClick={() => handleTransform(0, false, true)} className="interact-btn" style={{ background: '#0B0F16', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
                      <LucideIcon name="flip-vertical" width="16" height="16" /> {t('transform.flipV')}
                    </button>
                  </div>
                </div>

                {/* Crop Action */}
                <button 
                  onClick={handleCrop} disabled={isCropping} className="interact-btn" 
                  style={{ width: '100%', background: isCropping ? '#374151' : '#8b5cf6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: isCropping ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <LucideIcon name="crop" width="18" height="18" className={isCropping ? "spin" : ""} /> 
                  {isCropping ? t('rotatePage.processing') : t('cropPage.cropBtn')}
                </button>
              </div>

              {/* Kết quả Crop */}
              {croppedSrc && (
                <div className="anim-fade-in" style={{ background: '#161B22', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LucideIcon name="check-circle" width="16" height="16" /> {t('cropPage.done')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#B8C0CC', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                      {CanvasHelper.formatFileSize(croppedFileSize)}
                    </div>
                  </div>
                  <div style={{ background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                    <img src={croppedSrc} alt={t('cropPage.previewAlt')} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  </div>
                  <button onClick={handleDownload} className="interact-btn anim-pulse" style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LucideIcon name={ICONS.DOWNLOAD || "download"} width="18" height="18" /> {t('cropPage.download')}
                  </button>
                </div>
              )}

              <button onClick={handleReset} className="interact-btn" style={{ width: '100%', background: 'transparent', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name="refresh-cw" width="16" height="16" /> {t('cropPage.changeImage')}
              </button>

            </div>
          </div>
        )}

      </main>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.crop.h2') || "Cắt ảnh chuẩn xác theo ý muốn"}
          description={t('seo.crop.p1') || "Cắt xén các phần thừa của bức ảnh, tập trung vào đối tượng chính. Công cụ Crop của chúng tôi cho phép kéo thả cực kỳ mượt mà, hỗ trợ cả di động và máy tính."}
          features={[
            { title: t('seo.crop.f1.title') || "Cắt theo Aspect Ratio", desc: t('seo.crop.f1.desc') || "Dễ dàng cắt theo tỷ lệ chuẩn như Khung vuông 1:1, Ảnh bìa 16:9." }
          ]}
        />
        <RelatedTools currentTool="crop" />
      </div>

    </div>
  );
}