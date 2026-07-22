import { Icon, ICONS } from '../../../../shared/ui/icons';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPreviewItems, subscribeLayoutChange, updatePreviewTransform } from '../../engine/core/preview-group-manager.js';
import {
  isAnimationMode as animationModeState,
  toggleAnimationMode,
  initAnimationFromCurrentState,
  insertFrameAt,
  removeFrame,
  reorderFrame,
  frames,
  activeFrameIndex as activeFrameIndexState,
  setActiveFrameIndex,
  goToFrame,
  prevFrame,
  nextFrame,
  showOnionSkin as showOnionSkinState,
  toggleOnionSkin,
  getPreviousFrame,
  subscribeAnimationState
} from '../../engine/core/animation-state.js';
import AnimationStripPanel from './AnimationStripPanel.jsx';
import { GRID_WIDTH, GRID_HEIGHT } from '../../engine/core/state.js';
import { performQuickSave } from '../../engine/core/tab-manager.js';
import CanvasSettingsModal from '../resize/CanvasSettingsModal.jsx';
import { renderPixels, setForceFullRender } from '../../engine/core/render.js';
import { getZoom, getPan, setPan, applyTransform } from '../../engine/core/viewport.js';
import { t } from '../../../../i18n/i18n.js';

function OnionSkinLayer({ frame }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!ref.current || !frame) return;
    const { width, height, pixelMap } = frame;
    ref.current.width = width;
    ref.current.height = height;
    const ctx2d = ref.current.getContext('2d');
    const imageData = ctx2d.createImageData(width, height);
    const data32 = new Uint32Array(imageData.data.buffer);
    data32.set(pixelMap);
    ctx2d.putImageData(imageData, 0, 0);

    const mainCanvas = document.getElementById('pixelCanvas');
    if (mainCanvas) {
      applyTransform(mainCanvas);
    }
  }, [frame]);

  if (!frame) return null;

  return (
    <canvas
      id="onionSkinCanvas"
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.35,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
        zIndex: 1,
      }}
    />
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function CanvasPanel() {
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isAnimMode, setIsAnimMode] = useState(animationModeState);
  const [framesState, setFramesState] = useState(frames);
  const [previews, setPreviews] = useState(getPreviewItems);
  const isMobile = useIsMobile();

  useEffect(() => {
    return subscribeLayoutChange((newItems) => {
      setPreviews(newItems);
    });
  }, []);

  useEffect(() => {
    const pan = getPan();
    const zoom = getZoom();
    const showGridFlag = document.getElementById('showGrid')?.checked;
    updatePreviewTransform(pan.x, pan.y, zoom, GRID_WIDTH, GRID_HEIGHT, showGridFlag);
    setForceFullRender(true);
    renderPixels();
  }, [previews]);

  const [activeIndex, setActiveIndexState] = useState(activeFrameIndexState);
  const [showOnion, setShowOnion] = useState(showOnionSkinState);
  const [newFrameId, setNewFrameId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [removingFrameId, setRemovingFrameId] = useState(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const canvasFadeRef = useRef(null);

  useEffect(() => {
    // Attempt to find the portal target after initial mount
    const target = document.getElementById('mobile-animation-strip-portal');
    if (target) setPortalTarget(target);
    
    // In case ToolbarPanel mounts slightly later, listen to the custom event
    const handleToolbarMounted = () => {
      setPortalTarget(document.getElementById('mobile-animation-strip-portal'));
    };
    window.addEventListener('toolbar-mounted', handleToolbarMounted);
    return () => window.removeEventListener('toolbar-mounted', handleToolbarMounted);
  }, []);

  useEffect(() => {
    return subscribeAnimationState((newState) => {
      setIsAnimMode(newState.isAnimationMode);
      setActiveIndexState(newState.activeFrameIndex);
      setShowOnion(newState.showOnionSkin);
      setFramesState(newState.frames);
    });
  }, []);

  const handleToggleOnionSkin = () => {
    setShowOnion(toggleOnionSkin());
  };

  const shiftPanForFrameChange = (oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    const zoom = getZoom();
    const pan = getPan();
    const GAP = 32;
    const offsetIndex = newIndex - oldIndex;
    const offsetX = offsetIndex * (GRID_WIDTH * zoom + GAP);
    
    setPan(pan.x + offsetX, pan.y);
    const canvasEl = document.getElementById('pixelCanvas');
    if (canvasEl) {
      applyTransform(canvasEl);
    }
  };

  const handleSelectFrame = (index) => {
    const oldIndex = activeIndex;
    const newIndex = goToFrame(index);
    if (newIndex !== oldIndex) shiftPanForFrameChange(oldIndex, newIndex);
    setActiveIndexState(newIndex);
    triggerCanvasRedraw();
  };

  const handlePrevFrame = () => {
    const oldIndex = activeIndex;
    const newIndex = prevFrame();
    if (newIndex !== oldIndex) shiftPanForFrameChange(oldIndex, newIndex);
    setActiveIndexState(newIndex);
    triggerCanvasRedraw();
  };

  const handleNextFrame = () => {
    const oldIndex = activeIndex;
    const newIndex = nextFrame();
    if (newIndex !== oldIndex) shiftPanForFrameChange(oldIndex, newIndex);
    setActiveIndexState(newIndex);
    triggerCanvasRedraw();
  };

  const triggerCanvasRedraw = () => {
    setForceFullRender(true);
    renderPixels();
  };

  const handleReorderFrame = (fromIndex, toIndex) => {
    reorderFrame(fromIndex, toIndex);
    triggerCanvasRedraw();
  };

  const handleToggleAnimationMode = () => {
    const newValue = toggleAnimationMode();
    if (newValue) {
      initAnimationFromCurrentState();
    }
    setIsAnimMode(newValue);
    console.log('[AnimationMode]', newValue ? 'BẬT' : 'TẮT');
    performQuickSave(); // Save state immediately so F5 doesn't restore stale data
  };

  const handleInsertFrame = (atIndex) => {
    const newFrame = insertFrameAt(atIndex, GRID_WIDTH, GRID_HEIGHT);
    setActiveIndexState(activeFrameIndexState);
    triggerCanvasRedraw();
    setNewFrameId(newFrame.id);
    setTimeout(() => setNewFrameId(null), 500);
  };

  const handleRemoveFrame = (index) => {
    const frame = frames[index];
    if (!frame) return;

    const hasPixelData = frame.pixelMap && frame.pixelMap.some((v) => v !== 0);
    const hasHistory = frame.historyState && frame.historyState.undoStack && frame.historyState.undoStack.length > 0;

    if (hasPixelData || hasHistory) {
      if (!window.confirm(t('confirm.deleteFrame'))) return;
    }

    setRemovingFrameId(frame.id);
    setTimeout(() => {
      const removed = removeFrame(index);
      if (removed) {
        setActiveIndexState(activeFrameIndexState);
        triggerCanvasRedraw();
      }
      setRemovingFrameId(null);
    }, 200);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-mounted'));
  }, []);

  const mainAreaRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!mainAreaRef.current) return;
      const rect = mainAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mainAreaRef.current.style.setProperty('--mouse-x', `${x}px`);
      mainAreaRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
    
    const el = mainAreaRef.current;
    if (el) {
      el.addEventListener('mousemove', handleMouseMove);
      return () => el.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const navTools = (
    <>
      <button className="btn action-btn mobile-only undo-btn-action" data-i18n="tooltip.undo"><Icon name={ICONS.UNDO} /></button>
      <button className="btn action-btn mobile-only redo-btn-action" data-i18n="tooltip.redo"><Icon name={ICONS.REDO} /></button>
      <button className="tool-btn mobile-only" data-tool="cut" data-i18n="tooltip.cut" title={t('tooltip.cutDesc') || "Cut (Ctrl+X)"}><Icon name={ICONS.SCISSORS} /></button>
      <button className="tool-btn mobile-only" data-tool="copy" data-i18n="tooltip.copy" title={t('tooltip.copyDesc') || "Copy (Ctrl+C)"}><Icon name={ICONS.COPY} /></button>
      <button className="tool-btn mobile-only" data-tool="paste" data-i18n="tooltip.paste" title={t('tooltip.pasteDesc') || "Paste (Ctrl+V)"}><Icon name={ICONS.CLIPBOARD_PASTE} /></button>
      <button className="tool-btn" data-tool="pan" data-i18n="tool.pan"><Icon name={ICONS.HAND} /></button>
      <button className="btn action-btn" id="zoomInBtn" data-i18n="tooltip.zoomIn"><Icon name={ICONS.ZOOM_IN} /></button>
      <button className="btn action-btn" id="zoomOutBtn" data-i18n="tooltip.zoomOut"><Icon name={ICONS.ZOOM_OUT} /></button>
      <button className="btn action-btn" id="zoomResetBtn" data-i18n="tooltip.zoomReset"><Icon name={ICONS.MAXIMIZE} /></button>
    </>
  );

  return (
    <div ref={mainAreaRef} className="main-area" style={{ width: '100%', height: '100%' }}>
      <div id="canvasTabsContainer" className="canvas-tabs-container"></div>
      <div className="canvas-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Toast Notification Container */}
        <div id="toastContainer" className="toast-container">
          <div id="status" data-i18n="status.init" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{t('status.ready')}</div>
          <button
            id="stopTaskBtn"
            className="btn stop-btn"
            style={{ display: 'none', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', background: '#e06c75', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', marginLeft: '12px', pointerEvents: 'auto' }}
            data-i18n="btn.stopTask"
          >
            {t('btn.stopTask') || 'Dừng'}
          </button>
        </div>
        {/* Attached Tool Bar (Header) */}
        <div className={`toolbar-container ${isToolbarCollapsed ? 'collapsed' : ''}`} style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, transition: 'all 0.3s ease', width: 'auto', height: '32px', display: 'flex', gap: '8px' }}>
          <button
            className="btn collapse-toolbar-btn"
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--color-surface-alt)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '6px', border: '1px solid var(--color-border)', pointerEvents: 'auto', color: 'var(--color-text-bright)' }}
            title={t('tooltip.collapseToolbar')}
          >
            <span style={{ display: isToolbarCollapsed ? 'none' : 'block' }}><Icon name={ICONS.MINUS} style={{ width: '16px', height: '16px' }} /></span>
            <span style={{ display: isToolbarCollapsed ? 'block' : 'none' }}><Icon name={ICONS.PLUS} style={{ width: '16px', height: '16px' }} /></span>
          </button>
          <div className="toolbar-content" style={{ display: 'flex', height: '100%', gap: '8px', overflow: isToolbarCollapsed ? 'hidden' : 'visible', maxWidth: isToolbarCollapsed ? '0px' : '500px', opacity: isToolbarCollapsed ? 0 : 1, transition: 'max-width 0.3s ease, opacity 0.3s ease', whiteSpace: 'nowrap', pointerEvents: isToolbarCollapsed ? 'none' : 'auto' }}>
            <div className="grid-size-wrapper" style={{ position: 'relative' }}>
              <button 
                id="gridSizeSelectBtn" 
                className="btn" 
                data-i18n="tooltip.gridSize"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <span id="currentGridSizeText">32x32</span>
                <Icon name={ICONS.CHEVRON_DOWN} />
              </button>
              
              <CanvasSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
              />
            </div>

            <button
              id="toggleAnimationModeBtn"
              className="btn"
              onClick={handleToggleAnimationMode}
              title={isAnimMode ? t('tooltip.viewSource') : t('tooltip.viewAnimation')}
              style={isAnimMode ? { background: 'var(--accent)', color: '#fff' } : undefined}
            >
              <Icon name={ICONS.FILM} style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
        <div id="canvasBackground" className={isAnimMode ? 'is-animating' : ''}></div>
        {isAnimMode && showOnion && (
          <OnionSkinLayer frame={getPreviousFrame()} />
        )}
        <canvas id="pixelCanvas" className={isAnimMode ? 'is-animating' : ''}></canvas>
        {previews.map(p => (
          <div key={p.id} id={`group-${p.id}`} style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            <canvas id={p.id} className="preview-canvas" style={{ position: 'absolute', top: 0, left: 0 }}></canvas>
            <div id={`grid-${p.id}`} style={{ position: 'absolute', top: '-1px', left: '-1px', transformOrigin: '0 0' }}></div>
          </div>
        ))}
        <div id="gridOverlay" style={{ pointerEvents: 'none', position: 'absolute', top: '-1px', left: '-1px', transformOrigin: '0 0', zIndex: 10 }}>
          <div id="mirrorLine" style={{ display: 'none', position: 'absolute', left: '50%', top: 0, bottom: 0, background: 'rgba(255, 60, 60, 0.8)', zIndex: 10 }}></div>
          <div id="selectionOverlay" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', border: '1px dashed white', boxShadow: '0 0 0 1px black', zIndex: 20 }}></div>
        </div>
        <div id="brush-cursor"></div>
        <svg id="ruler-overlay" style={{ display: 'none', position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 998 }}>
          <line id="rulerLine" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <line id="rulerTickStart" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <line id="rulerTickEnd" x1="0" y1="0" x2="0" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <text id="rulerLabel" x="0" y="0" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke" fontSize="12" textAnchor="middle">0</text>
        </svg>
      </div>

      {/* Animation Strip or Floating Navigation */}
      {isAnimMode && (() => {
        const stripContent = (
          <AnimationStripPanel
            frames={framesState}
            activeFrameIndex={activeIndex}
            onSelectFrame={handleSelectFrame}
            onPrevFrame={handlePrevFrame}
            onNextFrame={handleNextFrame}
            showOnionSkin={showOnion}
            onToggleOnionSkin={handleToggleOnionSkin}
            onInsertFrame={handleInsertFrame}
            onRemoveFrame={handleRemoveFrame}
            onReorderFrame={handleReorderFrame}
            newFrameId={newFrameId}
            removingFrameId={removingFrameId}
          >
            {/* On desktop, show navTools in the strip. On mobile, it's separated into floating-nav. */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {navTools}
              </div>
            )}
          </AnimationStripPanel>
        );

        if (isMobile && portalTarget) {
          return createPortal(stripContent, portalTarget);
        }

        return stripContent;
      })()}

      {/* Floating Navigation ALWAYS renders on mobile, but on desktop only when NOT in anim mode */}
      <div className={`floating-nav ${isNavCollapsed ? 'collapsed' : ''} ${isAnimMode && !isMobile ? 'desktop-hide' : ''}`} style={{ display: isAnimMode && !isMobile ? 'none' : '' }} id="floatingNav">
        <div className="floating-nav-header">
          <span data-i18n="group.nav">{t('group.nav') || 'Điều hướng'}</span>
          <button id="toggleNavBtn" onClick={() => setIsNavCollapsed(!isNavCollapsed)} data-i18n="tooltip.toggleNav">
            <Icon name={ICONS.CHEVRON_DOWN} style={isNavCollapsed ? { transform: 'rotate(90deg)' } : {}} />
          </button>
        </div>
        <div className="floating-nav-content" id="floatingNavContent">
          {navTools}
        </div>
      </div>
    </div>
  );
}