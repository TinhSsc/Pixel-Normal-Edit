import React, { useState, useEffect, useRef } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { GRID_WIDTH, GRID_HEIGHT, setStatus, offscreenCanvas, offscreenCtx, offscreenImageData } from '../../engine/core/state.js';
import { setGridSize } from '../../engine/actions/grid-size-select.js';

export default function ResizeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState('');
  
  // Kích thước canvas mới (khung frame)
  const [newSize, setNewSize] = useState({ w: 100, h: 100 });
  
  // Kích thước ảnh cũ
  const [oldSize, setOldSize] = useState({ w: 100, h: 100 });
  
  // Vị trí ảnh cũ bên trong canvas mới (logical pixels)
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const [displayScale, setDisplayScale] = useState(10);
  
  const isDragging = useRef(false);
  const dragStart = useRef(null);

  const calculateDisplaySize = () => {
    if (!containerRef.current) return;
    const padding = 120;
    const containerW = containerRef.current.clientWidth - padding;
    const containerH = containerRef.current.clientHeight - padding;
    
    // Tính toán scale sao cho hiển thị trọn vẹn cả khung mới và ảnh cũ, cộng thêm khoảng an toàn
    const maxW = Math.max(newSize.w, oldSize.w, Math.abs(imgPos.x) + oldSize.w, newSize.w - imgPos.x);
    const maxH = Math.max(newSize.h, oldSize.h, Math.abs(imgPos.y) + oldSize.h, newSize.h - imgPos.y);
    
    const scaleX = containerW / Math.max(maxW, newSize.w);
    const scaleY = containerH / Math.max(maxH, newSize.h);
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    
    setDisplayScale(scale);
  };

  useEffect(() => {
    const handleOpen = (e) => {
      const { w: nw, h: nh } = e.detail;
      setNewSize({ w: nw, h: nh });
      setOldSize({ w: GRID_WIDTH, h: GRID_HEIGHT });
      setImgPos({ x: 0, y: 0 }); // Mặc định neo Top-Left
      
      if (offscreenCtx && offscreenImageData) {
        offscreenCanvas.width = GRID_WIDTH;
        offscreenCanvas.height = GRID_HEIGHT;
        offscreenCtx.putImageData(offscreenImageData, 0, 0);
        setImgDataUrl(offscreenCanvas.toDataURL());
      }
      setIsOpen(true);
    };
    
    window.addEventListener('open-resize-modal', handleOpen);
    window.addEventListener('resize', calculateDisplaySize);
    return () => {
      window.removeEventListener('open-resize-modal', handleOpen);
      window.removeEventListener('resize', calculateDisplaySize);
    };
  }, [imgPos, newSize, oldSize]); // Re-calculate display size when positions change

  // Cập nhật scale mỗi khi thay đổi state liên quan đến kích thước
  useEffect(() => {
    if (isOpen) {
      calculateDisplaySize();
    }
  }, [isOpen, imgPos, newSize, oldSize]);

  const closeModal = () => {
    setIsOpen(false);
  };

  const applyResize = () => {
    setGridSize(newSize.w, newSize.h, 'keep', Math.round(imgPos.x), Math.round(imgPos.y));
    setStatus(`Đã thay đổi kích thước thành ${newSize.w}x${newSize.h}`);
    closeModal();
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...imgPos }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragStart.current) return;
    
    const dx = (e.clientX - dragStart.current.startX) / displayScale;
    const dy = (e.clientY - dragStart.current.startY) / displayScale;
    
    setImgPos({
      x: dragStart.current.startPos.x + dx,
      y: dragStart.current.startPos.y + dy
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  // Quick Actions
  const anchor = (ax, ay) => {
    let nx = 0, ny = 0;
    if (ax === 'center') nx = (newSize.w - oldSize.w) / 2;
    if (ax === 'right') nx = newSize.w - oldSize.w;
    if (ay === 'center') ny = (newSize.h - oldSize.h) / 2;
    if (ay === 'bottom') ny = newSize.h - oldSize.h;
    setImgPos({ x: nx, y: ny });
  };

  const fitInside = () => {
    let nx = imgPos.x, ny = imgPos.y;
    if (oldSize.w <= newSize.w) {
      if (nx < 0) nx = 0;
      if (nx + oldSize.w > newSize.w) nx = newSize.w - oldSize.w;
    } else {
      if (nx > 0) nx = 0;
      if (nx + oldSize.w < newSize.w) nx = newSize.w - oldSize.w;
    }
    
    if (oldSize.h <= newSize.h) {
      if (ny < 0) ny = 0;
      if (ny + oldSize.h > newSize.h) ny = newSize.h - oldSize.h;
    } else {
      if (ny > 0) ny = 0;
      if (ny + oldSize.h < newSize.h) ny = newSize.h - oldSize.h;
    }
    setImgPos({ x: nx, y: ny });
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Toolbar */}
      <div style={{ height: '56px', backgroundColor: '#1e1e22', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} data-i18n="resizePopover.alignTitle">
          <Icon name={ICONS.MOVE} style={{width: 18, height: 18}}/> 
          Căn chỉnh (Resize Preview)
        </h3>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
             <span style={{fontSize: '12px', color: '#888', fontWeight: 500}} data-i18n="resizePopover.anchor">Neo (Anchor):</span>
             <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 12px)', 
                gridTemplateRows: 'repeat(3, 12px)',
                gap: '2px', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)',
                padding: '4px', 
                borderRadius: '4px'
             }}>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('left', 'top')} title="Top Left"></button>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('center', 'top')} title="Top Center"></button>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('right', 'top')} title="Top Right"></button>
                
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('left', 'center')} title="Center Left"></button>
                <button className="btn btn-primary" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('center', 'center')} title="Center (Căn giữa)"></button>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('right', 'center')} title="Center Right"></button>
                
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('left', 'bottom')} title="Bottom Left"></button>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('center', 'bottom')} title="Bottom Center"></button>
                <button className="btn" style={{padding: 0, minHeight: 0, borderRadius: '2px'}} onClick={() => anchor('right', 'bottom')} title="Bottom Right"></button>
             </div>
          </div>
          
          <div style={{width: 1, height: 24, background: 'var(--border)'}}></div>

          <button className="btn select-btn" onClick={fitInside} title="Vừa khít (Giữ toàn bộ ảnh trong khung)">
             <Icon name={ICONS.SHRINK} style={{width: 16, height: 16}}/> <span data-i18n="resizePopover.fit">Fit</span>
          </button>
          <button className="btn select-btn" onClick={() => anchor('left', 'top')} title="Khôi phục mặc định">
             <Icon name={ICONS.ROTATE_CCW} style={{width: 16, height: 16}}/> <span data-i18n="resizePopover.reset">Reset</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={closeModal} data-i18n="resizePopover.cancel" style={{ backgroundColor: 'transparent', border: '1px solid #555' }}>Hủy</button>
          <button className="btn btn-primary" onClick={applyResize} data-i18n="resizePopover.apply" style={{ backgroundColor: '#5b5bf0', color: '#fff' }}>Áp dụng</button>
        </div>
      </div>

      {/* Main Workspace */}
      <div 
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} 
        ref={containerRef}
        onPointerDown={handlePointerDown}
      >
        <div style={{ 
          position: 'relative', 
          width: `${newSize.w * displayScale}px`, 
          height: `${newSize.h * displayScale}px`,
          cursor: isDragging.current ? 'grabbing' : 'grab'
        }}>
          {/* Vùng ngoài Canvas mới (bị làm tối) */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            pointerEvents: 'none',
            zIndex: 10
          }}></div>
          
          {/* Nền Caro cho Canvas mới */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), 
                              linear-gradient(-45deg, #333 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #333 75%), 
                              linear-gradient(-45deg, transparent 75%, #333 75%)`,
            backgroundSize: `${(displayScale || 10) * 2}px ${(displayScale || 10) * 2}px`,
            backgroundPosition: `0 0, 0 ${(displayScale || 10)}px, ${(displayScale || 10)}px -${(displayScale || 10)}px, -${(displayScale || 10)}px 0px`,
            backgroundColor: '#222',
            zIndex: 1
          }}></div>
          
          {/* Viền trắng đứt khúc chỉ định khung Canvas mới */}
          <div style={{
            position: 'absolute',
            top: -1, left: -1, right: -1, bottom: -1,
            border: '2px dashed #fff',
            zIndex: 11,
            pointerEvents: 'none'
          }}></div>

          {/* Ảnh cũ (Draggable) bao gồm cả viền để dễ nhận diện khung canvas cũ */}
          <div style={{
            position: 'absolute',
            left: `${imgPos.x * displayScale}px`,
            top: `${imgPos.y * displayScale}px`,
            width: `${oldSize.w * displayScale}px`, 
            height: `${oldSize.h * displayScale}px`, 
            zIndex: 5,
            opacity: 0.9,
            border: '1px solid rgba(255,255,255,0.4)', // Viền mờ cho canvas cũ
            backgroundColor: 'rgba(255,255,255,0.05)'  // Nền mờ cho canvas cũ
          }}>
            <img 
              src={imgDataUrl} 
              alt="old canvas" 
              style={{ 
                width: '100%', 
                height: '100%', 
                imageRendering: 'pixelated',
                display: 'block'
              }} 
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
