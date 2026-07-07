import { Icon, ICONS } from '../components/icons';
import React, { useEffect, useState } from 'react';

export default function CanvasPanel() {
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-mounted'));
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="main-area" style={{ width: '100%', height: '100%' }}>
      <div id="canvasTabsContainer" className="canvas-tabs-container"></div>
      <div className="canvas-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Toast Notification Container */}
        <div id="toastContainer" className="toast-container">
          <div id="status" data-i18n="status.init" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Sẵn sàng</div>
          <button
            id="stopTaskBtn"
            className="btn stop-btn"
            style={{ display: 'none', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', background: '#e06c75', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', marginLeft: '12px', pointerEvents: 'auto' }}
            data-i18n="btn.stopTask"
          >
            Dừng
          </button>
        </div>
        {/* Attached Tool Bar (Header) */}
        <div className={`toolbar-container ${isToolbarCollapsed ? 'collapsed' : ''}`} style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 50, transition: 'all 0.3s ease', pointerEvents: 'none', width: 'auto', height: '32px', display: 'flex', gap: '8px' }}>
          <button
            className="btn collapse-toolbar-btn"
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '6px', border: '1px solid var(--color-border)', pointerEvents: 'auto', color: 'var(--color-text-bright)' }}
            title="Toggle Toolbar"
          >
            <span style={{ display: isToolbarCollapsed ? 'none' : 'block' }}><Icon name={ICONS.MINUS} style={{ width: '16px', height: '16px' }} /></span>
            <span style={{ display: isToolbarCollapsed ? 'block' : 'none' }}><Icon name={ICONS.PLUS} style={{ width: '16px', height: '16px' }} /></span>
          </button>
          <div className="toolbar-content" style={{ display: 'flex', height: '100%', gap: '8px', overflow: isToolbarCollapsed ? 'hidden' : 'visible', maxWidth: isToolbarCollapsed ? '0px' : '500px', opacity: isToolbarCollapsed ? 0 : 1, transition: 'max-width 0.3s ease, opacity 0.3s ease', whiteSpace: 'nowrap', pointerEvents: isToolbarCollapsed ? 'none' : 'auto' }}>
            <div className="grid-size-wrapper">
              <button id="gridSizeSelectBtn" className="btn" data-i18n="tooltip.gridSize">
                <span id="currentGridSizeText">32x32</span>
                <Icon name={ICONS.CHEVRON_DOWN} />
              </button>

              <div id="resizePopover" style={{ display: 'none', position: 'absolute', top: '100%', left: '0', marginTop: '6px', background: 'rgba(30, 30, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', width: '240px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 60, backdropFilter: 'blur(12px)', transition: 'all 0.2s ease' }}>

                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name={ICONS.MAXIMIZE} style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
                  <span data-i18n="resizePopover.canvasSize">Kích thước Canvas</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }} data-i18n="resizePopover.width">Width</label>
                    <input type="number" id="resizeWidth" defaultValue="32" min="1" max="256" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', transition: 'border 0.2s' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }} data-i18n="resizePopover.height">Height</label>
                    <input type="number" id="resizeHeight" defaultValue="32" min="1" max="256" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', transition: 'border 0.2s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '6px 8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
                  <input type="checkbox" id="resizeLockRatio" defaultChecked style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                  <label htmlFor="resizeLockRatio" style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none', color: '#ddd' }} data-i18n="resizePopover.lockRatio">Khóa tỷ lệ (Lock Ratio)</label>
                </div>

                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '6px' }} data-i18n="resizePopover.presets">Presets (Vuông)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '16px' }}>
                  <button className="btn resize-preset-btn" data-size="16" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>16</button>
                  <button className="btn resize-preset-btn" data-size="32" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>32</button>
                  <button className="btn resize-preset-btn" data-size="48" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>48</button>
                  <button className="btn resize-preset-btn" data-size="64" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>64</button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px', textAlign: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span data-i18n="resizePopover.afterResize">Canvas after resize:</span> <span id="resizePreviewText" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px' }}>32 × 32</span>
                </div>

                <button id="resizeApplyBtn" className="btn btn-primary" style={{ width: '100%', padding: '8px 0', fontSize: '13px', fontWeight: 600, borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} data-i18n="resizePopover.apply">Áp dụng (Apply)</button>
              </div>
            </div>
          </div>
        </div>
        <canvas id="pixelCanvas"></canvas>
        <div id="gridOverlay" style={{ pointerEvents: 'none', position: 'absolute', top: '-1px', left: '-1px', transformOrigin: '0 0' }}>
          <div id="mirrorLine" style={{ display: 'none', position: 'absolute', left: '50%', top: 0, bottom: 0, background: 'rgba(255, 60, 60, 0.8)', zIndex: 10 }}></div>
        </div>
        <div id="brush-cursor"></div>
        <svg id="ruler-overlay" style={{ display: 'none', position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 998 }}>
          <line id="rulerLine" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <line id="rulerTickStart" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <line id="rulerTickEnd" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <text id="rulerLabel" x="0" y="0" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke" fontSize="12" textAnchor="middle">0</text>
        </svg>
      </div>

      {/* Floating Navigation */}
      <div className="floating-nav" id="floatingNav">
        <div className="floating-nav-header">
          <span data-i18n="group.nav">Điều hướng</span>
          <button id="toggleNavBtn" data-i18n="tooltip.toggleNav"><Icon name={ICONS.CHEVRON_DOWN} /></button>
        </div>
        <div className="floating-nav-content" id="floatingNavContent">
          <button className="btn action-btn mobile-only undo-btn-action" data-i18n="tooltip.undo"><Icon name={ICONS.UNDO} /></button>
          <button className="btn action-btn mobile-only redo-btn-action" data-i18n="tooltip.redo"><Icon name={ICONS.REDO} /></button>
          <button className="tool-btn" data-tool="pan" data-i18n="tool.pan"><Icon name={ICONS.HAND} /></button>
          <button className="btn action-btn" id="zoomInBtn" data-i18n="tooltip.zoomIn"><Icon name={ICONS.ZOOM_IN} /></button>
          <button className="btn action-btn" id="zoomOutBtn" data-i18n="tooltip.zoomOut"><Icon name={ICONS.ZOOM_OUT} /></button>
          <button className="btn action-btn" id="zoomResetBtn" data-i18n="tooltip.zoomReset"><Icon name={ICONS.MAXIMIZE} /></button>
        </div>
      </div>
    </div>
  );
}