import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CustomNumberInput } from '../../../../shared/ui/CustomNumberInput';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { getItem, setItem } from '../../engine/core/storage.js';
import { setClipboardData } from '../../engine/core/state.js';
import { handlePaste } from '../../engine/actions/clipboard.js';
import { t } from '../../../../i18n/i18n.js';
import { normalizePixelData } from '../../../../shared/lib/pixel-utils.js';

function applyLimitAndSort(images, limit) {
  const pinned = images.filter(i => i.isPinned);
  const unpinned = images.filter(i => !i.isPinned);
  if (images.length > limit && unpinned.length > 0) {
    unpinned.sort((a, b) => b.timestamp - a.timestamp); // newest first
    const keptUnpinned = unpinned.slice(0, Math.max(0, limit - pinned.length));
    return [...pinned, ...keptUnpinned].sort((a, b) => b.timestamp - a.timestamp);
  }
  return images;
}

function ImageStorePreview({ width, height, pixels }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;

    // To prevent giant canvas preview, limit max size
    const MAX_PREVIEW_SIZE = 48; 
    let scale = 1;
    if (width > MAX_PREVIEW_SIZE || height > MAX_PREVIEW_SIZE) {
      scale = Math.min(MAX_PREVIEW_SIZE / width, MAX_PREVIEW_SIZE / height);
    }

    const drawW = Math.max(1, Math.floor(width * scale));
    const drawH = Math.max(1, Math.floor(height * scale));

    canvas.width = drawW;
    canvas.height = drawH;
    
    // We draw original pixels to an offscreen canvas and then drawImage to scale it
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);
    
    // Make sure pixels is Uint32Array
    data32.set(normalizePixelData(pixels));
    
    offCtx.putImageData(imgData, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offCanvas, 0, 0, width, height, 0, 0, drawW, drawH);
  }, [width, height, pixels]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        maxWidth: '100%', 
        maxHeight: '100%', 
        objectFit: 'contain',
        imageRendering: 'pixelated'
      }} 
    />
  );
}

export default function LocalImageStore() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 12; // Chỉnh lại 12 ảnh/trang khi kích thước to hơn
  const [limit, setLimit] = useState(() => {
    try {
      return parseInt(localStorage.getItem('local_image_store_limit'), 10) || 10;
    } catch {
      return 10;
    }
  });

  // Load from IndexedDB
  const loadImages = useCallback(async () => {
    try {
      const stored = await getItem('local_image_store');
      if (stored && Array.isArray(stored)) {
        setImages(stored);
      }
    } catch (e) {
      console.error('Failed to load local image store:', e);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Save whenever images change
  const saveImages = useCallback(async (newImages) => {
    try {
      await setItem('local_image_store', newImages);
    } catch (e) {
      console.error('Failed to save local image store:', e);
    }
  }, []);

  const handleLimitChange = (e) => {
    let newLimit = parseInt(e.target.value, 10);
    if (isNaN(newLimit) || newLimit < 1) newLimit = 1;
    setLimit(newLimit);
    localStorage.setItem('local_image_store_limit', newLimit.toString());
    
    // Trigger trim with new limit
    setImages(prev => {
      const next = applyLimitAndSort([...prev], newLimit);
      if (next.length !== prev.length) {
        saveImages(next);
      }
      return next;
    });
  };

  useEffect(() => {
    const onClipboardAdded = (e) => {
      const { width, height, pixels } = e.detail;
      
      setImages(prev => {
        // Check for duplicates
        let duplicateId = null;
        for (const img of prev) {
          if (img.width === width && img.height === height) {
            let imgData = normalizePixelData(img.pixels);
            let newPixelsData = normalizePixelData(pixels);

            let match = true;
            for (let i = 0; i < imgData.length; i++) {
              if (imgData[i] !== newPixelsData[i]) {
                match = false;
                break;
              }
            }
            if (match) {
              duplicateId = img.id;
              break;
            }
          }
        }

        if (duplicateId) {
          // Bump timestamp and move to front
          const updatedPrev = prev.map(img => 
            img.id === duplicateId ? { ...img, timestamp: Date.now() } : img
          );
          const dupItem = updatedPrev.find(img => img.id === duplicateId);
          const next = [dupItem, ...updatedPrev.filter(img => img.id !== duplicateId)];
          saveImages(next);
          return next;
        }

        const newItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          width,
          height,
          pixels,
          isPinned: false,
          timestamp: Date.now()
        };
        
        let next = [newItem, ...prev]; // Add to front
        
        // Enforce limit
        next = applyLimitAndSort(next, limit);
        
        saveImages(next);
        return next;
      });
    };

    window.addEventListener('local-clipboard-added', onClipboardAdded);
    return () => window.removeEventListener('local-clipboard-added', onClipboardAdded);
  }, [limit, saveImages]);

  const togglePin = (e, id) => {
    e.preventDefault();
    setImages(prev => {
      const next = prev.map(img => img.id === id ? { ...img, isPinned: !img.isPinned } : img);
      saveImages(next);
      return next;
    });
  };

  const handleLeftClick = (item) => {
    const data32 = normalizePixelData(item.pixels);
    setClipboardData({ width: item.width, height: item.height, pixels: data32 });
    handlePaste();
  };

  const deleteItem = (e, id) => {
    e.stopPropagation();
    setImages(prev => {
      const next = prev.filter(img => img.id !== id);
      saveImages(next);
      return next;
    });
  };

  const sortedImages = [...images].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return b.timestamp - a.timestamp;
    }
    return a.isPinned ? -1 : 1;
  });

  const totalPages = Math.ceil(sortedImages.length / ITEMS_PER_PAGE);
  const paginatedImages = sortedImages.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Auto adjust page if out of bounds
  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [totalPages, page]);

  return (
    <div className="tool-group">
      <div className="tool-group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
        <span data-i18n="group.localImageStore">{t('group.localImageStore') || 'Kho ảnh cục bộ'}</span>
        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontWeight: 'normal', color: 'var(--text-muted)' }} onClick={e => e.stopPropagation()}>
          <span data-i18n="label.limit">{t('label.limit') || 'Giới hạn:'}</span>
          <CustomNumberInput 
            min={1} 
            max={100} 
            value={limit} 
            onChange={handleLimitChange} 
            style={{ width: '60px', marginLeft: '4px' }} 
          />
        </label>
      </div>
      <div className="color-palette-grid" style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '6px', 
        minHeight: '40px',
        maxHeight: '350px', 
        overflowY: 'auto', 
        paddingRight: '2px',
        marginBottom: '6px'
      }}>
        {images.length === 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px' }} data-i18n="text.emptyStore">
            {t('text.emptyStore') || 'Trống. Hãy Copy/Cut để lưu.'}
          </div>
        )}
        {paginatedImages.map(item => (
          <div 
            key={item.id}
            style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: 'var(--surface-1)', 
              borderRadius: '4px', 
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.3)', // Viền nổi bật hơn cho nút
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'linear-gradient(45deg, var(--border) 25%, transparent 25%), linear-gradient(-45deg, var(--border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--border) 75%), linear-gradient(-45deg, transparent 75%, var(--border) 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
            }}
            onClick={() => handleLeftClick(item)}
            onContextMenu={(e) => togglePin(e, item.id)}
            title={t('tooltip.pasteImage') || 'Nhấn để Paste, Chuột phải để Ghim'}
            className="local-image-item"
          >
            <ImageStorePreview width={item.width} height={item.height} pixels={item.pixels} />
            
            <div 
              style={{ 
                position: 'absolute', 
                top: '-6px', 
                right: '-6px', 
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                opacity: item.isPinned ? 1 : 0.4
              }}
              className="pin-btn"
              onClick={(e) => togglePin(e, item.id)}
              title={item.isPinned ? (t('tooltip.unpin') || 'Bỏ ghim') : (t('tooltip.pin') || 'Ghim')}
            >
              <div style={{ 
                width: '14px', 
                height: '14px', 
                backgroundColor: 'var(--surface-0)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                border: item.isPinned ? '1px solid #ffb300' : '1px solid var(--border)',
                color: item.isPinned ? '#ffb300' : 'var(--text-muted)'
              }}>
                <svg viewBox="0 0 32 32" style={{ width: '8px', height: '8px', fill: 'currentColor' }}>
                  <path d="M27 4v27a1 1 0 0 1-1.625.781L16 24.281l-9.375 7.5A1 1 0 0 1 5 31V4a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4z"></path>
                </svg>
              </div>
            </div>

            {!item.isPinned && (
              <div 
                className="delete-btn"
                style={{ 
                  position: 'absolute', 
                  top: '-6px', 
                  left: '-6px', 
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  background: 'var(--color-danger, #ff4444)',
                  borderRadius: '50%',
                  color: 'white',
                  width: '14px',
                  height: '14px',
                  boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => deleteItem(e, item.id)}
                title={t('tooltip.deleteImage') || 'Xóa'}
              >
                <Icon name={ICONS.X} style={{ width: '10px', height: '10px' }} />
              </div>
            )}
            <style>{`
              .local-image-item:hover .delete-btn { display: flex !important; }
              .local-image-item:hover .pin-btn { opacity: 1 !important; }
            `}</style>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))} 
            disabled={page === 0}
            style={{ background: 'none', border: 'none', color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 0 ? 'default' : 'pointer', padding: '2px 6px' }}
          >
            ◀
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
            disabled={page === totalPages - 1}
            style={{ background: 'none', border: 'none', color: page === totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages - 1 ? 'default' : 'pointer', padding: '2px 6px' }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
