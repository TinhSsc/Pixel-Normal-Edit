import React, { useState, useEffect } from 'react';
import { activeLayerIndex, layers } from '../../engine/core/state.js';
import { selectLayer } from '../../engine/core/layer-manager.js';
import LayerMenuModal from '../modals/LayerMenuModal';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';

export default function LayerControl() {
  const [currentLayer, setCurrentLayer] = useState(activeLayerIndex);
  const [layerCount, setLayerCount] = useState(layers.length);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleLayerChanged = (e) => {
      setCurrentLayer(e.detail.activeLayerIndex);
      setLayerCount(e.detail.layers.length);
    };
    window.addEventListener('layer-changed', handleLayerChanged);
    return () => window.removeEventListener('layer-changed', handleLayerChanged);
  }, []);

  const handlePrev = () => {
    if (currentLayer > 0) {
      selectLayer(currentLayer - 1);
    }
  };

  const handleNext = () => {
    if (currentLayer < layerCount - 1) {
      selectLayer(currentLayer + 1);
    }
  };

  return (
    <div className="tool-group" style={{ padding: '12px' }}>
      <div className="tool-group-title" data-i18n="layer.title">{(t('layer.title') || 'LAYER CONTROL').toUpperCase()}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="custom-number-input" style={{ flex: 1, width: 'auto' }}>
          <div className="cni-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            L. {currentLayer}
          </div>
          <div className="cni-controls">
            <button className="cni-btn" onClick={handleNext} disabled={currentLayer === layerCount - 1}>
              <Icon name={ICONS.CHEVRON_UP} style={{ width: '14px', height: '14px' }} />
            </button>
            <button className="cni-btn" onClick={handlePrev} disabled={currentLayer === 0}>
              <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
        
        <button className="btn" style={{ height: '38px', padding: '0 12px' }} onClick={() => setShowModal(true)} title={t('layerControl.settings')}>
          <Icon name={ICONS.SETTINGS} style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
      {showModal && <LayerMenuModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
