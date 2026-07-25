import React, { useState, useEffect, useRef } from 'react';
import { activeLayerIndex, layers, GRID_WIDTH, GRID_HEIGHT } from '../../engine/core/state.js';
import { addLayer, removeLayer, moveLayerUp, moveLayerDown, toggleLayerVisibility, selectLayer } from '../../engine/core/layer-manager.js';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';

function LayerThumbnail({ pixelMap, width, height }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixelMap) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);
    data32.set(pixelMap);
    ctx.putImageData(imgData, 0, 0);
  }, [pixelMap, width, height]);

  return (
    <div style={{ 
      width: '32px', height: '32px', 
      background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKUlEQVQYV2NkYGAwYcSPAfkwDDDA6IgwakCMG4iM4c0IozXQG0wMDGAAo2ICh/o8B3kAAAAASUVORK5CYII=) repeat',
      borderRadius: '4px', overflow: 'hidden', 
      border: '1px solid var(--color-border)', flexShrink: 0 
    }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}


export default function LayerMenuModal({ onClose }) {
  const [currentLayers, setCurrentLayers] = useState([...layers]);
  const [activeIndex, setActiveIndex] = useState(activeLayerIndex);

  useEffect(() => {
    const handleLayerChanged = (e) => {
      setCurrentLayers([...e.detail.layers]);
      setActiveIndex(e.detail.activeLayerIndex);
    };
    window.addEventListener('layer-changed', handleLayerChanged);
    return () => window.removeEventListener('layer-changed', handleLayerChanged);
  }, []);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [currentLayers, activeIndex]);

  const handleSelectLayer = (index) => {
    selectLayer(index);
  };

  const handleToggleVisibility = (index, e) => {
    e.stopPropagation();
    toggleLayerVisibility(index);
  };

  const handleAddLayer = () => {
    addLayer();
  };

  const handleDeleteLayer = (index, e) => {
    e.stopPropagation();
    removeLayer(index);
  };

  const handleMoveLayer = (index, direction, e) => {
    e.stopPropagation();
    if (direction === 'up') moveLayerUp(index);
    if (direction === 'down') moveLayerDown(index);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div className="modal-content" style={{ width: '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 data-i18n="layer.title">{t('layer.title') || 'Layers'}</h2>
          <button className="btn" style={{ padding: '8px' }} onClick={onClose}>
            <Icon name={ICONS.X} style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
            {currentLayers.map((layer, index) => (
              <div 
                key={layer.id} 
                onClick={() => handleSelectLayer(index)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 12px', 
                  background: activeIndex === index ? 'var(--color-surface-hover, rgba(12, 110, 253, 0.1))' : 'var(--color-surface-alt)', 
                  border: activeIndex === index ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <button className="btn" onClick={(e) => handleToggleVisibility(index, e)} style={{ padding: '4px', background: layer.visible ? 'var(--color-primary)' : 'var(--color-surface)', borderColor: layer.visible ? 'var(--color-primary)' : 'var(--color-border)', color: layer.visible ? '#fff' : 'var(--color-text-muted)', flexShrink: 0 }}>
                    <Icon name={layer.visible ? ICONS.EYE : ICONS.EYE_OFF} style={{ width: '16px', height: '16px' }} />
                  </button>
                  <LayerThumbnail pixelMap={layer.pixelMap} width={GRID_WIDTH} height={GRID_HEIGHT} />
                  <span style={{ fontSize: '14px', fontWeight: activeIndex === index ? 600 : 400, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {layer.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button className="btn" onClick={(e) => handleMoveLayer(index, 'up', e)} disabled={index === currentLayers.length - 1} style={{ padding: '4px' }}>
                    <Icon name={ICONS.ARROW_UP} style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button className="btn" onClick={(e) => handleMoveLayer(index, 'down', e)} disabled={index === 0} style={{ padding: '4px' }}>
                    <Icon name={ICONS.ARROW_DOWN} style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button className="btn" onClick={(e) => handleDeleteLayer(index, e)} style={{ padding: '4px', color: 'var(--color-error)' }}>
                    <Icon name={ICONS.TRASH_2} style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddLayer} data-i18n="layer.add">
            {t('layer.add') || '+ Add Layer'}
          </button>
        </div>
      </div>
    </div>
  );
}
