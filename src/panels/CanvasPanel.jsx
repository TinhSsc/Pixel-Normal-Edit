import React, { useEffect } from 'react';

export default function CanvasPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-mounted'));
  }, []);

  return (
    <div className="main-area" style={{ width: '100%', height: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'transparent', padding: '0 10px', minHeight: '16px' }}>
        <div id="status" data-i18n="status.init" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '40px' }}>Sẵn sàng</div>
        <button
          id="stopTaskBtn"
          className="btn stop-btn"
          style={{ display: 'none', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '1px 6px', fontSize: '10px', background: '#e06c75', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          data-i18n="btn.stopTask"
        >
          Dừng
        </button>
      </div>
      <div id="canvasTabsContainer" className="canvas-tabs-container"></div>
      <div className="canvas-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        <canvas id="pixelCanvas"></canvas>
        <div id="gridOverlay" style={{ pointerEvents: 'none', position: 'absolute', top: '-1px', left: '-1px', transformOrigin: '0 0' }}>
          <div id="mirrorLine" style={{ display: 'none', position: 'absolute', left: '50%', top: 0, bottom: 0, background: 'rgba(255, 60, 60, 0.8)', zIndex: 10 }}></div>

          {/* Attached Tool Bar (Header) */}
          <div className="toolbar-container">
            <div className="grid-size-wrapper">
              <button id="gridSizeSelectBtn" className="btn" data-i18n="tooltip.gridSize">
                <span id="currentGridSizeText">32x32</span>
                <i data-lucide="chevron-down"></i>
              </button>

              <div id="resizePopover" style={{ display: 'none', position: 'absolute', top: '100%', left: '0', marginTop: '6px', background: 'rgba(30, 30, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', width: '240px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 60, backdropFilter: 'blur(12px)', transition: 'all 0.2s ease' }}>

                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i data-lucide="maximize" style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }}></i>
                  Kích thước Canvas
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Width</label>
                    <input type="number" id="resizeWidth" defaultValue="32" min="1" max="256" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', transition: 'border 0.2s' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Height</label>
                    <input type="number" id="resizeHeight" defaultValue="32" min="1" max="256" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', transition: 'border 0.2s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '6px 8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
                  <input type="checkbox" id="resizeLockRatio" defaultChecked style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                  <label htmlFor="resizeLockRatio" style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none', color: '#ddd' }}>Khóa tỷ lệ (Lock Ratio)</label>
                </div>

                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Presets (Vuông)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '16px' }}>
                  <button className="btn resize-preset-btn" data-size="16" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>16</button>
                  <button className="btn resize-preset-btn" data-size="32" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>32</button>
                  <button className="btn resize-preset-btn" data-size="48" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>48</button>
                  <button className="btn resize-preset-btn" data-size="64" style={{ padding: '4px 0', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>64</button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px', textAlign: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  Canvas after resize: <span id="resizePreviewText" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px' }}>32 × 32</span>
                </div>

                <button id="resizeApplyBtn" className="btn btn-primary" style={{ width: '100%', padding: '8px 0', fontSize: '13px', fontWeight: 600, borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Áp dụng (Apply)</button>
              </div>
            </div>
            {/* <button id="trimBtn" className="btn btn-primary" data-i18n="tooltip.trimFull" title="Cắt viền (Trim)" style={{ height: '26px', width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
              <i data-lucide="crop" style={{ width: '14px', height: '14px' }}></i>
            </button> */}
          </div>
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
