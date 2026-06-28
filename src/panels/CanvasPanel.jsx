import React, { useEffect } from 'react';

export default function CanvasPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-mounted'));
  }, []);

  return (
    <div className="main-area" style={{ width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#1c1c24', padding: '0 10px' }}>
        <div id="status" data-i18n="status.init" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sẵn sàng</div>
        <button 
          id="stopTaskBtn" 
          className="btn stop-btn" 
          style={{ display: 'none', flexShrink: 0, marginLeft: '10px', padding: '2px 8px', fontSize: '12px', background: '#e06c75', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 100 }}
          data-i18n="btn.stopTask"
        >
          Dừng
        </button>
      </div>
      <div className="canvas-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        <canvas id="pixelCanvas"></canvas>
        <canvas id="gridCanvas" style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}></canvas>
        <div id="gridOverlay" style={{ pointerEvents: 'none', position: 'absolute', top: '-1px', left: '-1px', transformOrigin: '0 0' }}>
          <div id="mirrorLine" style={{ display: 'none', position: 'absolute', left: '50%', top: 0, bottom: 0, background: 'rgba(255, 60, 60, 0.8)', zIndex: 10 }}></div>
        </div>
        <div id="brush-cursor"></div>
      </div>

      {/* Floating Navigation */}
      <div className="floating-nav" id="floatingNav">
        <div className="floating-nav-header">
          <span data-i18n="group.nav">Điều hướng</span>
          <button id="toggleNavBtn" data-i18n="tooltip.toggleNav"><i data-lucide="chevron-down"></i></button>
        </div>
        <div className="floating-nav-content" id="floatingNavContent">
          <button className="btn action-btn mobile-only undo-btn-action" data-i18n="tooltip.undo"><i data-lucide="undo"></i></button>
          <button className="btn action-btn mobile-only redo-btn-action" data-i18n="tooltip.redo"><i data-lucide="redo"></i></button>
          <button className="tool-btn" data-tool="pan" data-i18n="tool.pan"><i data-lucide="hand"></i></button>
          <button className="btn action-btn" id="zoomInBtn" data-i18n="tooltip.zoomIn"><i data-lucide="zoom-in"></i></button>
          <button className="btn action-btn" id="zoomOutBtn" data-i18n="tooltip.zoomOut"><i data-lucide="zoom-out"></i></button>
          <button className="btn action-btn" id="zoomResetBtn" data-i18n="tooltip.zoomReset"><i data-lucide="maximize"></i></button>
        </div>
      </div>
    </div>
  );
}
