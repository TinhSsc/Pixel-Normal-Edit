import React, { useEffect, useRef } from 'react';
import { Icon, ICONS } from '../components/icons';

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

function FrameThumbnail({ frame, index, isActive, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawFrameThumbnail(canvasRef.current, frame);
  }, [frame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        className={`animation-strip-frame${isActive ? ' active' : ''}`}
        onClick={onClick}
        title={`Trang ${index + 1}`}
      >
        <canvas ref={canvasRef} />
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
}) {
  if (!frames || frames.length === 0) return null;

  return (
    <div className="animation-strip">
      {activeFrameIndex > 0 && (
        <button
          className="animation-strip-nav-btn"
          onClick={onToggleOnionSkin}
          title="Xem trang trước (onion skin)"
          style={showOnionSkin ? { background: 'var(--color-primary)', color: '#fff' } : undefined}
        >
          👁
        </button>
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
    </div>
  );
}
