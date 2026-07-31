/**
 * Convert Page - Chuyển đổi định dạng ảnh
 * Giao diện Dark theme, tối giản (Dựa trên HomePage)
 */
import { useState, useRef, useEffect } from 'react';
import { CanvasHelper } from '../shared/CanvasHelper';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import RelatedTools from '../shared/RelatedTools';
import SEOContentBlock from '../shared/SEOContentBlock';
import { FORMAT_REGISTRY } from '../../../shared/image/format-registry.js';
import { encodeImage } from '../../../shared/image/encoder.js';
import { decodeImageWithAdvancedEngine } from '../../../shared/image/advanced-engine.js';
import { navigate, validateFile, isFileAdvanced } from '../../../shared/lib/file-utils.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ConvertPage() {
  const [filesData, setFilesData] = useState([]);
  const [error, setError] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  const [format, setFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.92);
  const [editMode, setEditMode] = useState('multi-tab'); // 'multi-tab' or 'animation'
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef(null);

  // Hydrate icons after mount
  useEffect(() => { reloadLucideIcons(); }, []);

  const handleFiles = async (files) => {
    if (files && files.length > 0) {
      const newFilesData = [];
      let errMsgs = [];
      for (const file of Array.from(files)) {
        try {
          if (!file.type.startsWith('image/')) {
            throw new Error(`File không được hỗ trợ: ${file.name}`);
          }

          const advanced = isFileAdvanced(file);
          if (advanced && !advancedMode) {
             throw new Error(`File "${file.name}" yêu cầu bật Chế độ Nâng cao.`);
          }
          let img;
          if (advanced) {
             const decodedBlob = await decodeImageWithAdvancedEngine(file);
             img = await CanvasHelper.loadImage(URL.createObjectURL(decodedBlob));
          } else {
             img = await CanvasHelper.loadImage(URL.createObjectURL(file));
          }
          if (img.naturalWidth > 8192 || img.naturalHeight > 8192) {
             errMsgs.push(`Cảnh báo: Ảnh "${file.name}" có kích thước rất lớn (${img.naturalWidth}x${img.naturalHeight}), có thể gây chậm trình duyệt.`);
          }
          const canvas = CanvasHelper.drawImageToCanvas(img);
          newFilesData.push({
            name: file.name,
            type: file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop().toUpperCase(),
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            canvas,
            src: URL.createObjectURL(file)
          });
        } catch (err) {
          errMsgs.push(err.message);
        }
      }
      
      if (errMsgs.length > 0) setError(errMsgs.join(' | '));
      else setError(null);
      
      if (newFilesData.length > 0) {
        setFilesData(prev => [...prev, ...newFilesData]);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleDownload = async () => {
    if (filesData.length === 0) return;
    setIsExporting(true);
    try {
      const formatInfo = FORMAT_REGISTRY.find(f => f.id === format);
      const ext = formatInfo ? formatInfo.ext : 'img';
      
      if (filesData.length === 1) {
         const blob = await encodeImage(filesData[0].canvas, format, quality, advancedMode);
         let outName = filesData[0].name.split('.')[0] + '_converted.' + ext;
         CanvasHelper.downloadBlob(blob, outName);
      } else {
         const zip = new JSZip();
         for (let i = 0; i < filesData.length; i++) {
            const fd = filesData[i];
            const blob = await encodeImage(fd.canvas, format, quality, advancedMode);
            let outName = fd.name.split('.')[0] + '_converted.' + ext;
            zip.file(outName, blob);
         }
         const zipBlob = await zip.generateAsync({ type: 'blob' });
         saveAs(zipBlob, 'converted_images.zip');
      }
    } catch (err) {
      setError(err.message);
    }
    setIsExporting(false);
  };

  const handleOpenInEditor = async () => {
     if (filesData.length === 0) return;
     setIsExporting(true);
     try {
       const exportData = [];
       for (const fd of filesData) {
          const blob = await encodeImage(fd.canvas, 'image/png', 1, false);
          const reader = new FileReader();
          const base64 = await new Promise(resolve => {
             reader.onloadend = () => resolve(reader.result);
             reader.readAsDataURL(blob);
          });
          exportData.push({ name: fd.name, data: base64 });
       }
       sessionStorage.setItem('pending_edit_images', JSON.stringify(exportData));
       sessionStorage.setItem('pending_edit_mode', editMode);
       window.location.href = '/';
     } catch (err) {
       setError(err.message);
     }
     setIsExporting(false);
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader 
        title={t('seo.convert.title') || "Đổi định dạng ảnh (Convert) - Nhanh chóng, Miễn phí | Pixel Normal Edit"}
        description={t('seo.convert.desc') || "Chuyển đổi định dạng hình ảnh WebP, PNG, JPG, GIF miễn phí và cực kỳ nhanh chóng."}
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
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name={ICONS.ARROW_LEFT_RIGHT} width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('mini_tools.convert.title', 'Đổi định dạng')}
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            {t('convert.hero.title', 'Chuyển đổi hình ảnh tức thì')}
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            {t('convert.hero.desc', 'Dễ dàng chuyển đổi qua lại giữa PNG, JPG và WebP. Quá trình xử lý diễn ra ngay trên trình duyệt, không cần tải ảnh lên máy chủ.')}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LucideIcon name={ICONS.ALERT_CIRCLE} width="20" height="20" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: advancedMode ? 'rgba(59, 130, 246, 0.1)' : '#161B22', padding: '8px 16px', borderRadius: '20px', border: advancedMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: advancedMode ? '#3b82f6' : '#8B949E' }}>Chế độ Nâng cao (TIFF, HEIC, AVIF, RAW...)</span>
          </label>
        </div>

        {filesData.length === 0 ? (
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
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <LucideIcon name={ICONS.UPLOAD} width="32" height="32" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>{t('convert.upload.dragDrop', 'Kéo thả ảnh vào đây')}</h3>
            <p style={{ fontSize: '15px', color: '#8B949E', margin: '0 0 24px 0' }}>{t('convert.upload.orClick', 'hoặc click để duyệt file trên thiết bị của bạn')}</p>
            <button className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
              {t('convert.upload.button', 'Chọn ảnh')}
            </button>
            <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '24px' }}>{t('convert.upload.support', 'Hỗ trợ: PNG, JPG, WebP, SVG, HEIC...')}</div>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Control Panel */}
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 250px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px' }}>{t('convert.controls.outputFormat', 'Định dạng đầu ra')}</div>
                <div style={{ display: 'flex', gap: '8px', background: '#0B0F16', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                  {FORMAT_REGISTRY.filter(f => (advancedMode || !f.advanced) && !f.inputOnly).map(f => {
                    return (
                      <button key={f.id} onClick={() => setFormat(f.id)} style={{ 
                        flex: '1 1 auto', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                        background: format === f.id ? '#3b82f6' : 'transparent',
                        color: format === f.id ? '#fff' : '#8B949E'
                      }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {format !== 'image/png' && (
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8C0CC', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('convert.controls.quality', 'Chất lượng')}</span>
                    <span style={{ color: '#3b82f6' }}>{Math.round(quality * 100)}%</span>
                  </div>
                  <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }} />
                </div>
              )}

              <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
                <button onClick={handleDownload} disabled={isExporting} className="interact-btn anim-pulse" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', opacity: isExporting ? 0.7 : 1 }}>
                  <LucideIcon name={ICONS.DOWNLOAD} width="18" height="18" />
                  {isExporting ? 'Đang xử lý...' : (filesData.length > 1 ? t('convert.controls.downloadZip', 'Tải file ZIP') : t('convert.controls.download', 'Tải về'))}
                </button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   {filesData.length > 1 && (
                      <select value={editMode} onChange={e => setEditMode(e.target.value)} style={{ padding: '6px', borderRadius: '6px', background: '#0B0F16', color: '#F5F7FA', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', marginBottom: '4px', cursor: 'pointer' }}>
                        <option value="multi-tab">Mở thành nhiều Tabs</option>
                        <option value="animation">Mở gộp thành Ảnh động (Animation)</option>
                      </select>
                   )}
                   <button 
                     onClick={handleOpenInEditor} 
                     disabled={isExporting}
                     className="interact-btn" 
                     style={{ background: '#161B22', color: '#B8C0CC', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', opacity: isExporting ? 0.7 : 1 }}
                   >
                     <LucideIcon name={ICONS.EDIT_3 || "edit-3"} width="16" height="16" />
                     {isExporting ? 'Đang gửi...' : t('convert.controls.openEditor', 'Mở trong Editor')}
                   </button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LucideIcon name={ICONS.IMAGE} width="16" height="16" style={{ color: '#8B949E' }} /> {t('convert.preview.title', 'Xem trước ảnh')} ({filesData.length})
                </div>
                
                <div>
                   <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
                   <button onClick={() => fileInputRef.current.click()} className="interact-btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <LucideIcon name="plus" width="14" height="14" /> Thêm ảnh
                   </button>
                </div>
              </div>
              
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=") repeat', minHeight: '300px', maxHeight: '500px', overflowY: 'auto' }}>
                {filesData.map((fd, i) => (
                   <div key={i} className="anim-fade-in" style={{ background: '#0B0F16', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <button onClick={() => setFilesData(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', color: 'white', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10 }}>
                         <LucideIcon name="x" width="14" height="14" />
                      </button>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161B22', borderRadius: '8px', padding: '4px', overflow: 'hidden' }}>
                         <img src={fd.src} alt={fd.name} style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ marginTop: '8px' }}>
                         <div style={{ fontSize: '11px', color: '#F5F7FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={fd.name}>{fd.name}</div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#8B949E' }}>
                            <span>{fd.type}</span>
                            <span>{CanvasHelper.formatFileSize(fd.size)}</span>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => setFilesData([])} className="interact-btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 20px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <LucideIcon name="trash-2" width="16" height="16" /> Xóa toàn bộ
              </button>
            </div>
          </div>
        )}

      </main>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 80px' }}>
        <SEOContentBlock 
          title={t('seo.convert.h2') || "Tại sao nên chuyển đổi định dạng ảnh tại Pixel Normal Edit?"}
          description={t('seo.convert.p1') || "Chuyển đổi định dạng hình ảnh (Convert) là nhu cầu thiết yếu khi làm việc với Pixel Art hoặc đồ hoạ web. Chúng tôi cung cấp giải pháp miễn phí, an toàn và nhanh chóng ngay trên trình duyệt."}
          features={[
            { title: t('seo.convert.f1.title') || "Không tải ảnh lên máy chủ", desc: t('seo.convert.f1.desc') || "Mọi tiến trình xử lý diễn ra trực tiếp trên trình duyệt của bạn (Client-side), đảm bảo quyền riêng tư tuyệt đối." },
            { title: t('seo.convert.f2.title') || "Đa định dạng", desc: t('seo.convert.f2.desc') || "Hỗ trợ chuẩn xuất WebP tiên tiến cho web, cùng các định dạng thông dụng như PNG, JPG, GIF." }
          ]}
          faqs={[
            { q: t('seo.convert.faq1.q') || "Ảnh của tôi có bị giảm chất lượng không?", a: t('seo.convert.faq1.a') || "Không. Quá trình convert giữ nguyên chất lượng gốc trừ khi bạn chủ động điều chỉnh cài đặt nén (Quality)." }
          ]}
        />
        <RelatedTools currentTool="convert" />
      </div>

    </div>
  );
}