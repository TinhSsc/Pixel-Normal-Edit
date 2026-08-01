import React, { useState, useEffect, useRef } from 'react';
import { CustomNumberInput } from '../../../../shared/ui/CustomNumberInput';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { GRID_WIDTH, GRID_HEIGHT, setStatus } from '../../engine/core/state.js';
import { setGridSize } from '../../engine/actions/grid-size-select.js';
import { t } from '../../../../i18n/i18n.js';

export default function CanvasSettingsModal({ isOpen, onClose }) {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [isLocked, setIsLocked] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [strategy, setStrategy] = useState('keep');
  
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setWidth(GRID_WIDTH);
      setHeight(GRID_HEIGHT);
      setAspectRatio(GRID_WIDTH / GRID_HEIGHT);
      
      // Close on click outside
      const handleClickOutside = (event) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target)) {
          // Check if click was on the toggle button
          const toggleBtn = document.getElementById('gridSizeSelectBtn');
          if (toggleBtn && !toggleBtn.contains(event.target)) {
            onClose();
          }
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isLocked && height > 0) {
      setAspectRatio(width / height);
    }
  }, [isLocked]);

  useEffect(() => {
    if (isOpen && window.lucide) {
      window.lucide.createIcons();
    }
  }, [isOpen]);

  const handleWidthChange = (e) => {
    const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0);
    setWidth(val);
    if (isLocked && val !== '') setHeight(Math.round(val / aspectRatio));
  };

  const handleHeightChange = (e) => {
    const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0);
    setHeight(val);
    if (isLocked && val !== '') setWidth(Math.round(val * aspectRatio));
  };

  const handleStandardPreset = (ratioW, ratioH) => {
    const maxDim = Math.max(width || GRID_WIDTH, height || GRID_HEIGHT);
    let newW, newH;
    if (ratioW >= ratioH) {
      newW = maxDim;
      newH = Math.round(maxDim * (ratioH / ratioW));
    } else {
      newH = maxDim;
      newW = Math.round(maxDim * (ratioW / ratioH));
    }
    setWidth(Math.max(1, newW));
    setHeight(Math.max(1, newH));
    if (isLocked) setAspectRatio(ratioW / ratioH);
  };

  const handleApply = () => {
    const finalW = width || GRID_WIDTH;
    const finalH = height || GRID_HEIGHT;
    
    if (finalW === GRID_WIDTH && finalH === GRID_HEIGHT) {
      onClose();
      return;
    }

    if (strategy === 'keep') {
      onClose();
      window.dispatchEvent(new CustomEvent('open-resize-modal', { detail: { w: finalW, h: finalH } }));
    } else {
      setGridSize(finalW, finalH, strategy);
      setStatus(`Đã thay đổi kích thước thành ${finalW}x${finalH}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={popoverRef}
      style={{ 
        position: 'absolute', 
        top: '100%', 
        left: '0', 
        marginTop: '8px', 
        zIndex: 60, 
        background: 'var(--color-surface)', 
        width: 'max-content',
        maxWidth: '560px', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)', 
        border: '1px solid var(--color-border)', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'default',
        whiteSpace: 'normal'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* L LEFT COLUMN: KÍCH THƯỚC */}
        <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Icon name={ICONS.MAXIMIZE} style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-bright)', margin: 0 }} data-i18n="settings.canvasSize">{t('settings.canvasSize') || 'Cài đặt Kích thước'}</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }} data-i18n="label.width">{t('label.width') || 'Width'}</label>
              <CustomNumberInput 
                value={width} 
                max={9999}
                onChange={handleWidthChange} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }} data-i18n="label.height">{t('label.height') || 'Height'}</label>
              <CustomNumberInput 
                value={height} 
                max={9999}
                onChange={handleHeightChange} 
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-surface-alt)', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
            <input type="checkbox" className="check" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', userSelect: 'none' }} data-i18n="label.lockRatio">{t('label.lockRatio') || 'Khóa tỷ lệ (Ratio)'}</span>
          </label>

          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase' }} data-i18n="label.presets">{t('label.presets') || 'Tỷ lệ (Presets)'}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { label: '1:1', ratioW: 1, ratioH: 1 },
                { label: '9:16', ratioW: 9, ratioH: 16 },
                { label: '16:9', ratioW: 16, ratioH: 9 },
                { label: '4:5', ratioW: 4, ratioH: 5 },
                { label: '4:3', ratioW: 4, ratioH: 3 },
                { label: '2:1', ratioW: 2, ratioH: 1 },
              ].map((preset) => (
                <button 
                  key={preset.label}
                  onClick={() => handleStandardPreset(preset.ratioW, preset.ratioH)}
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '11px', fontWeight: 'bold', padding: '6px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'center' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: '1px', background: 'var(--color-border)', display: 'block' }}></div>

        {/* RIGHT COLUMN: CHIẾN LƯỢC XỬ LÝ ẢNH */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px', lineHeight: 1.5 }}>
            {t('resizeModal.processStrategy') || 'Xử lý ảnh khi đổi sang'} <span style={{ background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{width} × {height}</span>:
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ display: 'flex', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${strategy === 'keep' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: strategy === 'keep' ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-surface-alt)', transition: 'all 0.2s' }}>
              <input type="radio" name="strategy" value="keep" checked={strategy === 'keep'} onChange={(e) => setStrategy(e.target.value)} style={{ display: 'none' }} />
              <div style={{ color: strategy === 'keep' ? 'var(--color-primary)' : 'var(--color-text-muted)', marginTop: '2px' }}>
                <Icon name={ICONS.CROP} style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: strategy === 'keep' ? 'var(--color-primary)' : 'var(--color-text-bright)' }} data-i18n="resizeModal.keepImage">{t('resizeModal.keepImage') || 'Giữ nguyên ảnh'}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.keepImageDesc">{t('resizeModal.keepImageDesc') || 'Giữ tỷ lệ gốc, tự động cắt hoặc bù thêm nền. (Sẽ căn chỉnh ở bước sau)'}</div>
              </div>
            </label>

            <label style={{ display: 'flex', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${strategy === 'scale' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: strategy === 'scale' ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-surface-alt)', transition: 'all 0.2s' }}>
              <input type="radio" name="strategy" value="scale" checked={strategy === 'scale'} onChange={(e) => setStrategy(e.target.value)} style={{ display: 'none' }} />
              <div style={{ color: strategy === 'scale' ? 'var(--color-primary)' : 'var(--color-text-muted)', marginTop: '2px' }}>
                <Icon name={ICONS.MAXIMIZE} style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: strategy === 'scale' ? 'var(--color-primary)' : 'var(--color-text-bright)' }} data-i18n="resizeModal.scaleImage">{t('resizeModal.scaleImage') || 'Thu phóng ảnh'}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.scaleImageDesc">{t('resizeModal.scaleImageDesc') || 'Co giãn toàn bộ hình ảnh vừa khít kích thước mới.'}</div>
              </div>
            </label>

            <label style={{ display: 'flex', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${strategy === 'clear' ? 'var(--color-danger)' : 'var(--color-border)'}`, background: strategy === 'clear' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface-alt)', transition: 'all 0.2s' }}>
              <input type="radio" name="strategy" value="clear" checked={strategy === 'clear'} onChange={(e) => setStrategy(e.target.value)} style={{ display: 'none' }} />
              <div style={{ color: strategy === 'clear' ? 'var(--color-danger)' : 'var(--color-text-muted)', marginTop: '2px' }}>
                <Icon name={ICONS.TRASH_2} style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: strategy === 'clear' ? 'var(--color-danger)' : 'var(--color-text-bright)' }} data-i18n="resizeModal.clearImage">{t('resizeModal.clearImage') || 'Xóa ảnh hiện tại'}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.clearImageDesc">{t('resizeModal.clearImageDesc') || 'Xóa toàn bộ ảnh cũ, tạo canvas trắng hoàn toàn.'}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* FOOTER & BUTTON */}
      <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button 
          onClick={onClose}
          className="btn"
          style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', border: '1px solid var(--color-border)' }}
          data-i18n="btn.cancel"
        >
          {t('btn.cancel') || 'Hủy'}
        </button>
        <button 
          onClick={handleApply}
          className="btn btn-primary"
          style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px' }}
          data-i18n="btn.apply"
        >
          {t('btn.apply') || 'Áp dụng'}
        </button>
      </div>
    </div>
  );
}
