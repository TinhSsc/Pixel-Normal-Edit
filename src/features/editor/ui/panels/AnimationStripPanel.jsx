import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, ICONS } from '../../../../shared/ui/icons';

function drawFrameThumbnail(canvasEl, frame) {
  if (!canvasEl || !frame) return;
  const { width, height, pixelMap } = frame;
  if (!width || !height) return;

  canvasEl.width = width;
  canvasEl.height = height;
  const ctx2d = canvasEl.getContext('2d');
  const imageData = ctx2d.createImageData(width, height);
  const data32 = new Uint32Array(imageData.data.buffer);
  data32.set(pixelMap);
  ctx2d.putImageData(imageData, 0, 0);
}
function FrameThumbnail({ frame, index, isActive, onClick, onInsertBefore, onInsertAfter, onRemove, onReorder, isNew, isRemoving }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawFrameThumbnail(canvasRef.current, frame);
  }, [frame]);

  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  return (
    <div
      className={`animation-strip-frame-wrap${isRemoving ? ' frame-exit' : ''}${isDragOver ? ' drag-over' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button className="animation-strip-frame-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Xóa trang này">
        <Icon name={ICONS.X} style={{ width: '14px', height: '14px' }} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {isActive && (
          <button className="animation-strip-frame-add-btn" onClick={(e) => { e.stopPropagation(); onInsertBefore(); }} title="Chèn trang trước">
            <Icon name={ICONS.PLUS} style={{ width: '14px', height: '14px' }} />
          </button>
        )}
        <div
          className={`animation-strip-frame${isActive ? ' active' : ''}${isNew ? ' frame-enter frame-highlight' : ''}`}
          onClick={onClick}
          title={`Trang ${index + 1}`}
        >
          <canvas id={`thumb-${frame.id}`} ref={canvasRef} />
        </div>
        {isActive && (
          <button className="animation-strip-frame-add-btn" onClick={(e) => { e.stopPropagation(); onInsertAfter(); }} title="Chèn trang sau">
            <Icon name={ICONS.PLUS} style={{ width: '14px', height: '14px' }} />
          </button>
        )}
      </div>
      <span className="animation-strip-frame-label">{index + 1}</span>
    </div>
  );
}


export default function AnimationStripPanel({
  frames,
  activeFrameIndex,
  onSelectFrame,
  onPrevFrame,
  onNextFrame,
  showOnionSkin,
  onToggleOnionSkin,
  onInsertFrame,
  onRemoveFrame,
  onReorderFrame,
  newFrameId,
  removingFrameId,
  children
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleRemoveRequest = (index) => {
    const expireTime = localStorage.getItem('hideDeleteFrameConfirm');
    if (expireTime && Date.now() < parseInt(expireTime, 10)) {
      onRemoveFrame(index);
    } else {
      setFrameToDelete(index);
    }
  };

  const confirmDelete = () => {
    if (dontAskAgain) {
      localStorage.setItem('hideDeleteFrameConfirm', (Date.now() + 2 * 60 * 60 * 1000).toString());
    }
    onRemoveFrame(frameToDelete);
    setFrameToDelete(null);
    setDontAskAgain(false);
  };

  if (!frames || frames.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        title="Mở thanh trang vẽ"
        className={`animation-strip-expand-btn ${!isCollapsed ? 'hidden' : ''}`}
      >
        <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '20px', height: '20px', transform: 'rotate(90deg)' }} />
      </button>

      <div className={`animation-strip ${isCollapsed ? 'collapsed' : ''}`}>
      {activeFrameIndex > 0 && (
        <label className="anim-eye-container" title="Xem trang trước (onion skin)">
          <input type="checkbox" checked={showOnionSkin} onChange={onToggleOnionSkin} />
          <Icon name={ICONS.EYE} className="eye" />
          <Icon name={ICONS.EYE_OFF} className="eye-slash" />
        </label>
      )}
      <button
        className="animation-strip-nav-btn"
        onClick={onPrevFrame}
        disabled={activeFrameIndex <= 0}
        title="Trang trước"
      >
        <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '14px', height: '14px', transform: 'rotate(90deg)' }} />
      </button>

      <div className="animation-strip-frames">
        {frames.map((frame, index) => (
          <FrameThumbnail
            key={frame.id}
            frame={frame}
            index={index}
            isActive={index === activeFrameIndex}
            onClick={() => onSelectFrame(index)}
            onInsertBefore={() => onInsertFrame(index)}
            onInsertAfter={() => onInsertFrame(index + 1)}
            onRemove={() => handleRemoveRequest(index)}
            onReorder={onReorderFrame}
            isNew={frame.id === newFrameId}
            isRemoving={frame.id === removingFrameId}
          />
        ))}
      </div>

      <button
        className="animation-strip-nav-btn"
        onClick={onNextFrame}
        disabled={activeFrameIndex >= frames.length - 1}
        title="Trang sau"
      >
        <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '14px', height: '14px', transform: 'rotate(-90deg)' }} />
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children && (
          <div className="animation-strip-tools" style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '16px', borderLeft: '1px solid var(--color-border)', flexShrink: 0 }}>
            {children}
          </div>
        )}
        <div style={{ width: '1px', height: '32px', background: 'var(--color-border)', marginLeft: '4px', marginRight: '4px' }} />
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Thu gọn"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px', border: 'none',
            background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-bright)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '20px', height: '20px', transform: 'rotate(-90deg)' }} />
        </button>
      </div>

      {frameToDelete !== null && createPortal(
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 999999 }}>
          <div className="modal-content" style={{ maxWidth: '320px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--color-text-bright)' }}>Xác nhận xóa</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Bạn có chắc chắn muốn xóa trang {frameToDelete + 1} không?</p>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <input type="checkbox" id="dontAskDeleteFrame" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label htmlFor="dontAskDeleteFrame" style={{ cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px' }}>Không nhắc lại (trong 2 giờ)</label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn" onClick={() => { setFrameToDelete(null); setDontAskAgain(false); }}>Hủy</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
    </>
  );
}