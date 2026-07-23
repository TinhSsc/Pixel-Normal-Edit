import React, { useState, useEffect, useRef } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';
import { textToolState, setTextToolState, setPreviewPixels, GRID_WIDTH, GRID_HEIGHT } from '../../engine/core/state.js';
import { getZoom, getPan } from '../../engine/core/viewport.js';
import { commitTextTool, cancelTextTool } from '../../engine/tools/text.js';
import { previewRasterizeText } from '../../engine/algorithms/text-algo.js';
import { renderPixels } from '../../engine/core/render.js';

const FONTS = ['Arial', 'Courier New', 'Times New Roman', 'Comic Sans MS', 'Impact', 'Verdana', 'Tahoma', 'Trebuchet MS'];

export default function TextToolOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [box, setBox] = useState(null);
  const [zoom, setZoomState] = useState(1);
  const [pan, setPanState] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [font, setFont] = useState('Arial');
  const [size, setSize] = useState(16);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [color, setColor] = useState('#000000');
  const [isEditing, setIsEditing] = useState(false);

  const isDragging = useRef(false);
  const dragState = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleToolUpdated = (e) => {
      const state = e.detail;
      setIsActive(state.isActive);
      setBox(state.box);
      setIsEditing(state.isEditing);
      if (state.isActive) {
        setText(state.text);
        setFont(state.font);
        setSize(state.size);
        setBold(state.bold);
        setItalic(state.italic);
        setColor(state.color);
      }
    };

    const handleViewportChanged = (e) => {
      setZoomState(e.detail.zoom);
      setPanState({ x: e.detail.panX, y: e.detail.panY });
    };

    // Initial viewport state
    setZoomState(getZoom());
    setPanState(getPan());

    window.addEventListener('text-tool-updated', handleToolUpdated);
    window.addEventListener('viewport-changed', handleViewportChanged);
    return () => {
      window.removeEventListener('text-tool-updated', handleToolUpdated);
      window.removeEventListener('viewport-changed', handleViewportChanged);
    };
  }, []);

  // Effect to update preview when text/style changes
  useEffect(() => {
    if (isActive && box) {
      const stateObj = { box, text, font, size, bold, italic, color };
      const preview = previewRasterizeText(stateObj, GRID_WIDTH, GRID_HEIGHT);
      setPreviewPixels(preview);
      renderPixels(true);
    } else {
      setPreviewPixels(null);
      renderPixels(true);
    }
  }, [isActive, box, text, font, size, bold, italic, color]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
      }, 0);
    }
  }, [isActive, bold, italic]);

  const updateState = (updates) => {
    setTextToolState(updates);
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
    
    const { handle, startX, startY, startBox } = dragState.current;
    
    // Convert screen pixel delta to logical grid delta
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    
    let newBox = { ...startBox };

    if (handle === 'move') {
      newBox.x = startBox.x + dx;
      newBox.y = startBox.y + dy;
    } else {
      if (handle.includes('e')) newBox.width = startBox.width + dx;
      if (handle.includes('w')) {
        newBox.x = startBox.x + dx;
        newBox.width = startBox.width - dx;
      }
      if (handle.includes('s')) newBox.height = startBox.height + dy;
      if (handle.includes('n')) {
        newBox.y = startBox.y + dy;
        newBox.height = startBox.height - dy;
      }

      if (newBox.width < 1) { newBox.x = startBox.x; newBox.width = 1; }
      if (newBox.height < 1) { newBox.y = startBox.y; newBox.height = 1; }
    }

    setBox(newBox);
    updateState({ box: newBox });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  if (!isActive || !box) return null;

  const leftPx = pan.x + box.x * zoom;
  const topPx = pan.y + box.y * zoom;
  const widthPx = box.width * zoom;
  const heightPx = box.height * zoom;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Box */}
      <div 
        className="text-tool-overlay-ui"
        style={{ 
          position: 'absolute', 
          left: `${leftPx}px`, 
          top: `${topPx}px`, 
          width: `${widthPx}px`, 
          height: `${heightPx}px`,  
          border: '1px solid #5b5bf0', 
          boxShadow: '0 0 0 1px rgba(255,255,255,0.5)', 
          pointerEvents: 'auto',
          cursor: isEditing ? 'text' : 'default'
        }}
        onDoubleClick={() => updateState({ isEditing: true })}
      >
        {/* Compact Header for Cancel, Move, Apply */}
        <div 
          className="text-tool-overlay-ui"
          style={{
            position: 'absolute',
            top: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#5b5bf0',
            color: 'white',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            height: '24px',
            overflow: 'hidden'
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div 
            onClick={cancelTextTool}
            title={t('text.cancel') || 'Hủy'}
            style={{ padding: '0 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', borderRight: '1px solid rgba(255,255,255,0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="x" style={{ width: '14px', height: '14px', color: '#ffaaaa' }} />
          </div>

          <div 
            onPointerDown={(e) => handlePointerDown(e, 'move')}
            title="Kéo để di chuyển"
            style={{ padding: '0 8px', cursor: 'move', display: 'flex', alignItems: 'center', height: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="move" style={{ width: '14px', height: '14px' }} />
          </div>

          <div 
            onClick={commitTextTool}
            title={t('text.apply') || 'Xác nhận'}
            style={{ padding: '0 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="check" style={{ width: '14px', height: '14px', color: '#aaffaa' }} />
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateState({ text: e.target.value });
          }}
          onBlur={() => {
            // Keep editing if they click toolbar. The canvas click will commit it via text.js
          }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: 0,
            margin: 0,
            fontFamily: font,
            fontSize: `${size * zoom}px`, // visual scaling
            fontWeight: bold ? 'bold' : 'normal',
            fontStyle: italic ? 'italic' : 'normal',
            color: 'transparent',
            caretColor: 'white',
            lineHeight: 1.2,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            pointerEvents: isEditing ? 'auto' : 'none'
          }}
        />

        {/* Resize Handles */}
        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
          let style = { 
            position: 'absolute', 
            background: '#fff', 
            border: '2px solid #5b5bf0', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5b5bf0',
            fontWeight: 'bold',
            fontSize: '8px'
          };

          // Size and positioning
          if (['nw', 'ne', 'sw', 'se'].includes(handle)) {
            style.width = '12px';
            style.height = '12px';
            style.borderRadius = '50%';
          } else {
            style.width = ['n', 's'].includes(handle) ? '16px' : '10px';
            style.height = ['e', 'w'].includes(handle) ? '16px' : '10px';
            style.borderRadius = '4px';
          }

          if (handle.includes('n')) style.top = '-6px';
          if (handle.includes('s')) style.bottom = '-6px';
          if (handle.includes('w')) style.left = '-6px';
          if (handle.includes('e')) style.right = '-6px';
          if (handle === 'n' || handle === 's') style.left = 'calc(50% - 8px)';
          if (handle === 'e' || handle === 'w') style.top = 'calc(50% - 8px)';

          let cursor = 'default';
          if (handle === 'nw' || handle === 'se') cursor = 'nwse-resize';
          if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
          if (handle === 'n' || handle === 's') cursor = 'ns-resize';
          if (handle === 'e' || handle === 'w') cursor = 'ew-resize';

          let icon = null;
          if (handle === 'n') icon = 'up';
          if (handle === 's') icon = 'down';
          if (handle === 'w') icon = 'left';
          if (handle === 'e') icon = 'right';

          return (
            <div 
              key={handle} 
              style={{ ...style, cursor, pointerEvents: 'auto' }} 
              onPointerDown={(e) => handlePointerDown(e, handle)} 
            >
              {icon === 'up' && <Icon name="chevron-up" style={{ width: '10px', height: '10px' }} />}
              {icon === 'down' && <Icon name="chevron-down" style={{ width: '10px', height: '10px' }} />}
              {icon === 'left' && <Icon name="chevron-left" style={{ width: '10px', height: '10px' }} />}
              {icon === 'right' && <Icon name="chevron-right" style={{ width: '10px', height: '10px' }} />}
            </div>
          );
        })}
      </div>


    </div>
  );
}
