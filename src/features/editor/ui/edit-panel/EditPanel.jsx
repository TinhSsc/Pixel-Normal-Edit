import { Icon, ICONS } from '../../../../shared/ui/icons';
import React, { useEffect, useState } from 'react';
import { bindPopups } from '../../engine/core/popup-manager.js';
import { editConfig } from './edit-manager.js';
import { navigationConfig } from './navigation-manager.js';
import { updateDOM, t } from '../../../../i18n/i18n.js';
import { CustomDropdown } from '../../../../shared/ui/CustomDropdown';
import ToolButton from '../toolbar/ToolButton';
import { subscribeAnimationState, getAnimationState } from '../../engine/core/animation-state.js';

function AnimationPreview() {
  const [animState, setAnimState] = useState(null);
  const canvasRef = React.useRef(null);
  const [playIdx, setPlayIdx] = useState(0);
  const [fps, setFps] = useState(10); // 10 FPS
  
  useEffect(() => {
    setAnimState(getAnimationState());
    const unsub = subscribeAnimationState(setAnimState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!animState || !animState.isAnimationMode || animState.frames.length <= 1) return;
    const interval = setInterval(() => {
      setPlayIdx(old => (old + 1) % animState.frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [animState, fps]);

  useEffect(() => {
    if (!animState || !animState.isAnimationMode || animState.frames.length === 0) return;
    const frame = animState.frames[playIdx % animState.frames.length];
    if (!frame) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    
    canvasEl.width = frame.width;
    canvasEl.height = frame.height;
    const ctx2d = canvasEl.getContext('2d');
    const imageData = ctx2d.createImageData(frame.width, frame.height);
    const data32 = new Uint32Array(imageData.data.buffer);
    data32.set(frame.pixelMap);
    ctx2d.putImageData(imageData, 0, 0);
  }, [playIdx, animState]);

  if (!animState || !animState.isAnimationMode) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '150px', objectFit: 'contain', imageRendering: 'pixelated' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span data-i18n="label.animationPage">{t('label.animationPage', playIdx % animState.frames.length + 1, animState.frames.length)}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span data-i18n="label.speed">{t('label.speed')}</span>
          <input type="number" min="1" max="60" value={fps} onChange={e => setFps(Math.max(1, parseInt(e.target.value) || 10))} style={{ width: '40px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '2px', padding: '2px' }} />
          <span data-i18n="label.fps">{t('label.fps')}</span>
        </label>
      </div>
    </div>
  );
}

export default function EditPanel() {
  const [hiddenEdits, setHiddenEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pixel-edit-hidden-edits')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onHiddenEditsChanged = (e) => setHiddenEdits(e.detail || []);
    window.addEventListener('hidden-edits-changed', onHiddenEditsChanged);
    return () => window.removeEventListener('hidden-edits-changed', onHiddenEditsChanged);
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    updateDOM();
  }, [hiddenEdits]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settings-mounted'));
  }, []);

  useEffect(() => {
    let unbind = () => {};
    // Need a small timeout to let React render the new DOM elements first
    const timer = setTimeout(() => {
      unbind = bindPopups('.right-panel', 'right');
    }, 50);
    return () => {
      clearTimeout(timer);
      unbind();
    };
  }, [hiddenEdits]);

  return (
    <div className="right-panel" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {[...navigationConfig.groups, ...editConfig.groups].map(group => {
        const isNavigation = navigationConfig.groups.some(g => g.id === group.id);
        const configToUse = isNavigation ? navigationConfig : editConfig;
        
        const visibleTools = group.tools.filter(toolId => !hiddenEdits.includes(toolId));
        if (visibleTools.length === 0) return null;

        return (
          <div className="tool-group" key={group.id}>
            <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n={group.titleKey}>{group.defaultTitle}</div>
            <div className="tool-grid" style={{ gap: '10px' }}>
              {visibleTools.map(toolId => {
                const tool = configToUse.tools[toolId];
                if (!tool) return null;

                let btnContent = null;
                if (tool.type === 'checkbox') {
                  btnContent = (
                    <label data-i18n={tool.tooltipKey} className={`tool-btn ${tool.defaultActive ? 'active' : ''}`} id={tool.labelId} style={{ cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" id={tool.inputId} style={{ display: 'none' }} defaultChecked={tool.defaultActive} />
                      <Icon name={tool.icon} />
                    </label>
                  );
                } else if (tool.type === 'button') {
                  btnContent = (
                    <button id={tool.buttonId} className="tool-btn" data-i18n={tool.tooltipKey}>
                      <Icon name={tool.icon} />
                    </button>
                  );
                } else if (tool.type === 'tool') {
                  btnContent = <ToolButton toolConfig={tool} />;
                }

                if (!tool.hasPopup) {
                  return <React.Fragment key={toolId}>{btnContent}</React.Fragment>;
                }

                return (
                  <div key={toolId} className={`tool-with-popup-${tool.popupPosition}`}>
                    {btnContent}
                    <div className={`popup-bridge-${tool.popupPosition}`}>
                      <div className="tool-popup" style={tool.type === 'button' ? { width: 'max-content' } : {}}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }} data-i18n={tool.popupContent.labelKey}>{tool.popupContent.defaultTitle}</label>
                        <CustomDropdown 
                          id={tool.popupContent.selectId}
                          style={{ minWidth: '100px' }}
                          options={tool.popupContent.options.map((opt) => ({
                            value: opt.value,
                            label: t(opt.labelKey) || opt.defaultLabel
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="panel-section" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }} data-i18n="label.sourceImage">{t('label.sourceImage') || 'Ảnh gốc'}</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button id="setBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px' }} data-i18n="tooltip.setBg">
              <Icon name={ICONS.IMAGE_PLUS} style={{ width: '14px', height: '14px' }} />
              <span data-i18n="label.bg">{t('label.bg') || 'Nền'}</span>
            </button>
            <button id="replaceBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px', display: 'none' }} data-i18n="tooltip.replaceBg">
              <Icon name={ICONS.IMAGE} style={{ width: '14px', height: '14px' }} />
            </button>
            <button id="flattenBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px', display: 'none' }} data-i18n="tooltip.flattenBg">
              <Icon name={ICONS.BLEND} style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
        <AnimationPreview />
        <img id="imagePreview" style={{ display: 'none' }} alt="" />
      </div>
    </div>
  );
}
