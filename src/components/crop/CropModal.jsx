import React, { useState, useEffect, useRef } from 'react';
import { Icon, ICONS } from '../icons';
import { GRID_WIDTH, GRID_HEIGHT, pixelMap, setCurrentTool, setStatus, offscreenCanvas, offscreenCtx, offscreenImageData } from '../../js/core/state.js';
import { beginStroke, commitStroke, recordChange } from '../../js/core/history.js';
import { renderPixels } from '../../js/core/render.js';
import { parseUint32ToHex } from '../../js/core/color-utils.js';

export default function CropModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState('');
  const [aspect, setAspect] = useState(null);
  
  const [box, setBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 'auto', height: 'auto' });
  const [imageSize, setImageSize] = useState({ w: 100, h: 100 });
  
  const isDragging = useRef(false);
  const dragState = useRef(null);

  const calculateDisplaySize = () => {
    if (!containerRef.current || !imageRef.current) return;
    const padding = 80; // 40px padding on each side
    const containerW = containerRef.current.clientWidth - padding;
    const containerH = containerRef.current.clientHeight - padding;
    
    const natW = imageRef.current.naturalWidth;
    const natH = imageRef.current.naturalHeight;
    
    if (natW <= 0 || natH <= 0) return;

    const scaleX = containerW / natW;
    const scaleY = containerH / natH;
    const scale = Math.min(scaleX, scaleY);
    
    setDisplaySize({
      width: `${Math.floor(natW * scale)}px`,
      height: `${Math.floor(natH * scale)}px`,
      scale: scale
    });
    setImageSize({ w: natW, h: natH });
  };

  useEffect(() => {
    const handleToolChanged = (e) => {
      if (e.detail?.tool === 'crop') {
        openModal();
      }
    };
    window.addEventListener('tool-changed', handleToolChanged);
    window.addEventListener('resize', calculateDisplaySize);
    return () => {
      window.removeEventListener('tool-changed', handleToolChanged);
      window.removeEventListener('resize', calculateDisplaySize);
    };
  }, []);

  const openModal = () => {
    if (offscreenCtx && offscreenImageData) {
      offscreenCanvas.width = GRID_WIDTH;
      offscreenCanvas.height = GRID_HEIGHT;
      offscreenCtx.putImageData(offscreenImageData, 0, 0);
      setImgDataUrl(offscreenCanvas.toDataURL());
    }
    setBox({ x: 0, y: 0, w: GRID_WIDTH, h: GRID_HEIGHT }); // logical coordinates
    setAspect(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => btn.classList.remove('active'));
    setCurrentTool('');
  };

  const applyCrop = () => {
    // Erase everything outside the box
    const minX = Math.round(box.x);
    const minY = Math.round(box.y);
    const maxX = minX + Math.round(box.w);
    const maxY = minY + Math.round(box.h);

    beginStroke();
    let changed = false;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (x < minX || x >= maxX || y < minY || y >= maxY) {
          const idx = y * GRID_WIDTH + x;
          const p = pixelMap[idx];
          if (p !== 0) {
            recordChange(idx, p, 0);
            pixelMap[idx] = 0;
            changed = true;
          }
        }
      }
    }

    commitStroke(pixelMap);
    if (changed) {
      renderPixels();
      setStatus('Đã cắt ảnh thành công.');
    }
    closeModal();
  };

  const handlePointerDown = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...box }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragState.current) return;
    
    // Calculate scale factor between logical grid and displayed image
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.w / rect.width;
    const scaleY = imageSize.h / rect.height;

    const { handle, startX, startY, startBox } = dragState.current;
    
    const dx = (e.clientX - startX) * scaleX;
    const dy = (e.clientY - startY) * scaleY;
    
    let newBox = { ...startBox };

    if (handle === 'move') {
      newBox.x = startBox.x + dx;
      newBox.y = startBox.y + dy;
      
      newBox.x = Math.max(0, Math.min(newBox.x, imageSize.w - newBox.w));
      newBox.y = Math.max(0, Math.min(newBox.y, imageSize.h - newBox.h));
    } else {
      if (handle.includes('e')) newBox.w = startBox.w + dx;
      if (handle.includes('w')) {
        newBox.x = startBox.x + dx;
        newBox.w = startBox.w - dx;
      }
      if (handle.includes('s')) newBox.h = startBox.h + dy;
      if (handle.includes('n')) {
        newBox.y = startBox.y + dy;
        newBox.h = startBox.h - dy;
      }

      if (aspect && handle !== 'move') {
        if (handle === 'e' || handle === 'w') {
          newBox.h = newBox.w / aspect;
        } else if (handle === 's' || handle === 'n') {
          newBox.w = newBox.h * aspect;
        } else {
          if (Math.abs(dx) > Math.abs(dy)) {
            newBox.h = newBox.w / aspect;
          } else {
            newBox.w = newBox.h * aspect;
          }
        }
      }

      if (newBox.w < 1) { newBox.x = startBox.x; newBox.w = 1; }
      if (newBox.h < 1) { newBox.y = startBox.y; newBox.h = 1; }
      
      if (newBox.x < 0) { newBox.w += newBox.x; newBox.x = 0; }
      if (newBox.y < 0) { newBox.h += newBox.y; newBox.y = 0; }
      
      if (newBox.x + newBox.w > imageSize.w) {
        newBox.w = imageSize.w - newBox.x;
        if (aspect) newBox.h = newBox.w / aspect;
      }
      if (newBox.y + newBox.h > imageSize.h) {
        newBox.h = imageSize.h - newBox.y;
        if (aspect) newBox.w = newBox.h * aspect;
      }
    }

    setBox(newBox);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const setRatio = (r) => {
    setAspect(r);
    if (r) {
      // Adjust box to fit new ratio immediately
      const newBox = { ...box };
      newBox.h = newBox.w / r;
      if (newBox.y + newBox.h > imageSize.h) {
        newBox.h = imageSize.h - newBox.y;
        newBox.w = newBox.h * r;
      }
      setBox(newBox);
    }
  };

  if (!isOpen) return null;

  // Convert logical coordinates to percentage for CSS placement
  const leftPct = (box.x / imageSize.w) * 100;
  const topPct = (box.y / imageSize.h) * 100;
  const widthPct = (box.w / imageSize.w) * 100;
  const heightPct = (box.h / imageSize.h) * 100;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Toolbar */}
      <div style={{ height: '56px', backgroundColor: '#1e1e22', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }} data-i18n="crop.title">Cắt ảnh (Crop)</h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn select-btn ${aspect === null ? 'active' : ''}`} onClick={() => setRatio(null)}><span data-i18n="crop.ratioFree">Free</span></button>
          <button className={`btn select-btn ${aspect === 1 ? 'active' : ''}`} onClick={() => setRatio(1)}>1:1</button>
          <button className={`btn select-btn ${aspect === 4/3 ? 'active' : ''}`} onClick={() => setRatio(4/3)}>4:3</button>
          <button className={`btn select-btn ${aspect === 16/9 ? 'active' : ''}`} onClick={() => setRatio(16/9)}>16:9</button>
          <button className={`btn select-btn ${aspect === 3/4 ? 'active' : ''}`} onClick={() => setRatio(3/4)}>3:4</button>
          <button className={`btn select-btn ${aspect === 9/16 ? 'active' : ''}`} onClick={() => setRatio(9/16)}>9:16</button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="crop-btn" onClick={closeModal} data-i18n="crop.cancel" style={{ backgroundColor: 'transparent', border: '1px solid #555' }}>Hủy</button>
          <button className="crop-btn primary" onClick={applyCrop} data-i18n="crop.apply" style={{ backgroundColor: '#5b5bf0', color: '#fff' }}>Áp dụng</button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '40px' }} ref={containerRef}>
        <div style={{ 
          position: 'relative', 
          maxWidth: '100%', 
          maxHeight: '100%', 
          display: 'inline-block',
          backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), 
                            linear-gradient(-45deg, #333 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #333 75%), 
                            linear-gradient(-45deg, transparent 75%, #333 75%)`,
          backgroundSize: `${(displaySize.scale || 10) * 2}px ${(displaySize.scale || 10) * 2}px`,
          backgroundPosition: `0 0, 0 ${(displaySize.scale || 10)}px, ${(displaySize.scale || 10)}px -${(displaySize.scale || 10)}px, -${(displaySize.scale || 10)}px 0px`,
          backgroundColor: '#222'
        }}>
          
          <img 
            ref={imageRef} 
            src={imgDataUrl} 
            alt="canvas" 
            onLoad={calculateDisplaySize}
            style={{ display: 'block', width: displaySize.width, height: displaySize.height, imageRendering: 'pixelated' }} 
            draggable={false}
          />

          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute' }}>
              <defs>
                <mask id="crop-mask-modal">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={`${leftPct}%`} y={`${topPct}%`} width={`${widthPct}%`} height={`${heightPct}%`} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask-modal)" />
            </svg>
            
            <div 
              style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${widthPct}%`, height: `${heightPct}%`, border: '1px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)', pointerEvents: 'auto', cursor: 'move' }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
              <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
              <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
              <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
              <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
              
              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
                let style = { position: 'absolute', width: '12px', height: '12px', background: '#fff', border: '1px solid #000', borderRadius: '50%' };
                if (handle.includes('n')) style.top = '-6px';
                if (handle.includes('s')) style.bottom = '-6px';
                if (handle.includes('w')) style.left = '-6px';
                if (handle.includes('e')) style.right = '-6px';
                if (handle === 'n' || handle === 's') style.left = 'calc(50% - 6px)';
                if (handle === 'e' || handle === 'w') style.top = 'calc(50% - 6px)';

                let cursor = 'default';
                if (handle === 'nw' || handle === 'se') cursor = 'nwse-resize';
                if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
                if (handle === 'n' || handle === 's') cursor = 'ns-resize';
                if (handle === 'e' || handle === 'w') cursor = 'ew-resize';

                return (
                  <div key={handle} style={{ ...style, cursor }} onPointerDown={(e) => handlePointerDown(e, handle)} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
