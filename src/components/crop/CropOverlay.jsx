import React, { useState, useEffect, useRef } from 'react';
import { getZoom, getPan } from '../../js/core/viewport.js';
import { GRID_WIDTH, GRID_HEIGHT } from '../../js/core/state.js';

export default function CropOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [transform, setTransform] = useState({ panX: 0, panY: 0, zoom: 1 });
  
  const isDragging = useRef(false);
  const dragState = useRef(null);
  
  useEffect(() => {
    const handleToolChanged = (e) => {
      if (e.detail?.tool === 'crop') {
        setIsActive(true);
        // Initialize crop box to full image size if needed
        setBox({ x: 0, y: 0, w: GRID_WIDTH, h: GRID_HEIGHT });
        updateTransform();
      } else {
        setIsActive(false);
      }
    };
    
    const updateTransform = () => {
      const pan = getPan();
      setTransform({ panX: pan.x, panY: pan.y, zoom: getZoom() });
    };

    window.addEventListener('tool-changed', handleToolChanged);
    
    const interval = setInterval(() => {
      if (document.querySelector('.tool-btn[data-tool="crop"]')?.classList.contains('active')) {
        if (!isActive) {
          setIsActive(true);
          setBox(prev => prev.w === 0 ? { x: 0, y: 0, w: GRID_WIDTH, h: GRID_HEIGHT } : prev);
        }
        updateTransform();
      } else {
        if (isActive) setIsActive(false);
      }
    }, 1000 / 60);

    return () => {
      window.removeEventListener('tool-changed', handleToolChanged);
      clearInterval(interval);
    };
  }, [isActive]);

  const handlePointerDown = (e, handle) => {
    if (!isActive) return;
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    
    const cropRatioSelect = document.getElementById('cropRatio');
    const ratioValue = cropRatioSelect ? cropRatioSelect.value : 'free';
    let aspect = null;
    if (ratioValue !== 'free') {
      const parts = ratioValue.split(':');
      if (parts.length === 2) {
        aspect = parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    }

    dragState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...box },
      aspect
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragState.current) return;
    
    const { handle, startX, startY, startBox, aspect } = dragState.current;
    
    // Convert screen dx/dy to pixel canvas dx/dy
    const zoom = transform.zoom;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    
    let newBox = { ...startBox };

    if (handle === 'move') {
      newBox.x = startBox.x + dx;
      newBox.y = startBox.y + dy;
      
      // Constrain move to canvas bounds
      newBox.x = Math.max(0, Math.min(newBox.x, GRID_WIDTH - newBox.w));
      newBox.y = Math.max(0, Math.min(newBox.y, GRID_HEIGHT - newBox.h));
    } else {
      // Resize logic
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

      // Aspect ratio enforcement
      if (aspect && handle !== 'move') {
        if (handle === 'e' || handle === 'w') {
          newBox.h = newBox.w / aspect;
        } else if (handle === 's' || handle === 'n') {
          newBox.w = newBox.h * aspect;
        } else {
          // Corner drag with aspect ratio
          if (Math.abs(dx) > Math.abs(dy)) {
            newBox.h = newBox.w / aspect;
          } else {
            newBox.w = newBox.h * aspect;
          }
        }
      }

      // Constrain resize to canvas bounds and min size
      if (newBox.w < 1) { newBox.x = startBox.x; newBox.w = 1; }
      if (newBox.h < 1) { newBox.y = startBox.y; newBox.h = 1; }
      
      if (newBox.x < 0) { newBox.w += newBox.x; newBox.x = 0; }
      if (newBox.y < 0) { newBox.h += newBox.y; newBox.y = 0; }
      
      if (newBox.x + newBox.w > GRID_WIDTH) {
        newBox.w = GRID_WIDTH - newBox.x;
        if (aspect) newBox.h = newBox.w / aspect;
      }
      if (newBox.y + newBox.h > GRID_HEIGHT) {
        newBox.h = GRID_HEIGHT - newBox.y;
        if (aspect) newBox.w = newBox.h * aspect;
      }
    }

    setBox(newBox);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    
    // Dispatch event with current box
    window.dispatchEvent(new CustomEvent('crop-box-updated', { detail: { box } }));
  };

  if (!isActive) return null;

  const { panX, panY, zoom } = transform;
  
  // Convert logical box to screen pixels for rendering
  const screenBox = {
    left: panX + box.x * zoom,
    top: panY + box.y * zoom,
    width: box.w * zoom,
    height: box.h * zoom
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 100 }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect 
              x={screenBox.left} 
              y={screenBox.top} 
              width={screenBox.width} 
              height={screenBox.height} 
              fill="black" 
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
      </svg>
      
      <div 
        style={{
          position: 'absolute',
          left: screenBox.left,
          top: screenBox.top,
          width: screenBox.width,
          height: screenBox.height,
          border: '1px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          cursor: 'move'
        }}
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
            <div 
              key={handle}
              style={{ ...style, cursor }}
              onPointerDown={(e) => handlePointerDown(e, handle)}
            />
          );
        })}
      </div>
    </div>
  );
}
