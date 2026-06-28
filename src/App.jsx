import { useEffect, useRef, useState } from 'react';

import { initEditor } from './js/main.js';

import { pixelMap } from './js/core/state.js';

import { DockviewReact } from 'dockview-react';

import 'dockview-core/dist/styles/dockview.css';

import { t } from './js/lang/i18n.js';



import ToolbarPanel from './panels/ToolbarPanel.jsx';

import CanvasPanel from './panels/CanvasPanel.jsx';

import SettingsPanel from './panels/SettingsPanel.jsx';



const components = {

  toolbar: ToolbarPanel,

  canvas: CanvasPanel,

  settings: SettingsPanel,

};



function App() {

  const isInit = useRef(false);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);



  useEffect(() => {

    const handleResize = () => setIsDesktop(window.innerWidth > 768);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  useEffect(() => {

    if (isInit.current) return;

    isInit.current = true;

    setTimeout(() => {

      initEditor();

    }, 100);

  }, []);



  const onReady = (event) => {

    const canvasPanel = event.api.addPanel({

      id: 'canvas',

      component: 'canvas',

      title: t('app.title') || 'Pixel Normal Edit',

    });



    const toolbarPanel = event.api.addPanel({

      id: 'toolbar',

      component: 'toolbar',

      title: t('group.draw') || 'Công cụ',

      position: { direction: 'left', referencePanel: 'canvas' },

      minimumWidth: 120,

    });



    const settingsPanel = event.api.addPanel({

      id: 'settings',

      component: 'settings',

      title: t('group.operations') || 'Thao tác',

      position: { direction: 'right', referencePanel: 'canvas' },

      minimumWidth: 160,

    });



    // Set initial sizes once - user can freely resize after this

    requestAnimationFrame(() => {

      try {

        toolbarPanel.api.setSize({ width: 150 });

        settingsPanel.api.setSize({ width: 220 });

      } catch (_) { }

    });

  };

  useEffect(() => {
    const handleMouseEnter = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      const popup = wrapper.querySelector('.popup-bridge-bottom');
      if (popup) {
        popup.style.display = 'block';
        popup.style.position = 'fixed';
        popup.style.zIndex = '9999';
        popup.style.right = 'auto';

        const updatePosition = () => {
          const rect = wrapper.getBoundingClientRect();
          popup.style.top = (rect.bottom + 5) + 'px';
          
          let left = rect.left;
          const popupRect = popup.getBoundingClientRect();
          if (left + popupRect.width > window.innerWidth) {
            left = window.innerWidth - popupRect.width - 10;
          }
          popup.style.left = left + 'px';
        };

        updatePosition();
        wrapper._updatePosition = updatePosition;
        const container = wrapper.closest('.header');
        if (container) {
          // Headers usually don't scroll, but just in case
          container.addEventListener('scroll', updatePosition, { passive: true });
          wrapper._scrollContainer = container;
        }
      }
    };

    const handleMouseLeave = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      const popup = wrapper.querySelector('.popup-bridge-bottom');
      if (popup) {
        popup.style.display = '';
        popup.style.position = '';
        popup.style.zIndex = '';
        popup.style.top = '';
        popup.style.left = '';
        popup.style.right = '';
        
        if (wrapper._updatePosition && wrapper._scrollContainer) {
          wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
        }
      }
    };

    // Use a small timeout to let elements mount properly
    const timer = setTimeout(() => {
      const wrappers = document.querySelectorAll('.header .tool-with-popup-bottom');
      wrappers.forEach(w => {
        w.addEventListener('mouseenter', handleMouseEnter);
        w.addEventListener('mouseleave', handleMouseLeave);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      const wrappers = document.querySelectorAll('.header .tool-with-popup-bottom');
      wrappers.forEach(w => {
        w.removeEventListener('mouseenter', handleMouseEnter);
        w.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);


  return (

    <>

      <div className="container">

        <div className="header">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-bright)' }} data-i18n="app.title">Pixel Normal Edit</h1>

            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'none' }} data-i18n="app.desc">Pixel Normal Edit</span>

          </div>

          <div className="header-actions">

            <select id="gridSizeSelect" className="btn" data-i18n="tooltip.gridSize" defaultValue="32">

              <option value="16">16 x 16</option>

              <option value="24">24 x 24</option>

              <option value="32">32 x 32</option>

              <option value="48">48 x 48</option>

              <option value="64">64 x 64</option>

              <option value="custom" data-i18n="option.customSize">Tùy chỉnh...</option>

            </select>

            <button id="toggleToolsBtn" className="btn btn-primary mobile-only" data-i18n="tooltip.toggleTools">

              <i data-lucide="menu" style={{ width: '18px', height: '18px' }}></i>

              <span data-i18n="text.showTools">Mở công cụ</span>

            </button>

            <button id="openUploadModalBtn" className="btn" data-i18n="tooltip.uploadFull">

              <i data-lucide="upload" style={{ width: '18px', height: '18px' }}></i>

              <span data-i18n="btn.upload">Tải lên</span>

            </button>

            <button id="compressBtn" className="btn btn-primary" data-i18n="tooltip.compressFull">

              <i data-lucide="minimize" style={{ width: '18px', height: '18px' }}></i>

              <span data-i18n="btn.compress">Nén ảnh</span>

            </button>

            <button id="openDownloadModalBtn" className="btn btn-primary" style={{ background: 'var(--color-success)' }} data-i18n="tooltip.exportFull">
              <i data-lucide="download" style={{ width: '18px', height: '18px' }}></i>
              <span data-i18n="btn.export">Tải xuống</span>
            </button>

            <button className="btn desktop-only undo-btn-action" data-i18n="tooltip.undo"><i data-lucide="undo" style={{ width: '18px', height: '18px' }}></i></button>

            <button className="btn desktop-only redo-btn-action" data-i18n="tooltip.redo"><i data-lucide="redo" style={{ width: '18px', height: '18px' }}></i></button>

            <button id="loginBtn" className="btn" data-i18n="tooltip.login" onClick={(e) => {

              e.preventDefault();

              if (pixelMap && pixelMap.size > 0) {

                if (!window.confirm(t('confirm.leave') || "Bạn có chắc chuyển sang nơi khác? Mọi dữ liệu bản vẽ chưa lưu sẽ bị mất!")) {

                  return;

                }

              }

              window.location.href = '#login';

            }}>

              <i data-lucide="user" style={{ width: '18px', height: '18px' }}></i>

            </button>

          </div>

        </div>



        {isDesktop ? (

          <div className="editor-layout" style={{ position: 'relative' }}>

            <DockviewReact

              components={components}

              onReady={onReady}

              className="dockview-theme-dark"

              disableFloat={false}

              margin={4}

            />

          </div>

        ) : (

          <div className="editor-layout">

            <ToolbarPanel />

            <CanvasPanel />

            <SettingsPanel />

          </div>

        )}

      </div>



      {/* Upload Modal */}

      <div id="uploadModal" className="modal-overlay" style={{ display: 'none' }}>

        <div className="modal-content">

          <div className="modal-header">

            <h3 style={{ margin: 0, fontSize: '16px' }} data-i18n="modal.uploadTitle">Tải dữ liệu lên</h3>

            <button id="closeUploadModalBtn" className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }}><i data-lucide="x"></i></button>

          </div>



          <div className="modal-tabs">

            <button className="tab-btn active" data-tab="tab-image" data-i18n="modal.tabImage">Ảnh (PNG/JPG)</button>

            <button className="tab-btn" data-tab="tab-json" data-i18n="modal.tabJson">Dữ liệu (JSON)</button>

          </div>



          <div className="tab-content active" id="tab-image">

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer', marginBottom: '15px' }}>

              <input type="checkbox" id="autoSizeOnUpload" defaultChecked />

              <span data-i18n="modal.autoSize">Tự động chỉnh lưới theo kích thước ảnh</span>

            </label>

            <div id="imageDropZone" className="drag-drop-zone">

              <i data-lucide="image" style={{ width: '32px', height: '32px', color: 'var(--color-primary)', marginBottom: '10px' }}></i>

              <div data-i18n="modal.dropImage">Kéo thả ảnh vào đây hoặc nhấp để chọn</div>

              <input type="file" id="imageUploadModal" accept="image/*" style={{ display: 'none' }} />

            </div>

          </div>



          <div className="tab-content" id="tab-json">

            <textarea id="jsonInputText" data-i18n="modal.jsonPlaceholder" placeholder="Dán mã JSON (hoặc nội dung file .txt) vào đây..."

              style={{ width: '100%', height: '180px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '6px', padding: '10px', fontFamily: 'monospace', resize: 'vertical', marginBottom: '10px', fontSize: '12px' }}></textarea>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>

              <button id="parseJsonTextBtn" className="btn btn-primary" style={{ flex: 1 }}>

                <i data-lucide="code"></i>

                <span data-i18n="modal.parseJson">Nhập từ Text</span>

              </button>

            </div>



            <div id="jsonDropZone" className="drag-drop-zone">

              <i data-lucide="file-json" style={{ width: '32px', height: '32px', color: 'var(--color-success)', marginBottom: '10px' }}></i>

              <div data-i18n="modal.dropJson">Hoặc kéo thả file .json vào đây</div>

              <input type="file" id="jsonUploadModal" accept=".json, .txt, application/json, text/plain" style={{ display: 'none' }} />

            </div>

          </div>

        </div>

      </div>



      {/* Download Modal */}
      <div id="downloadModal" className="modal-overlay" style={{ display: 'none' }}>
        <div className="modal-content" style={{ maxWidth: '300px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, fontSize: '16px' }} data-i18n="modal.downloadTitle">Tải về máy</h3>
            <button id="closeDownloadModalBtn" className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }}><i data-lucide="x"></i></button>
          </div>
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="dl-format-btn btn" data-format="png" style={{ justifyContent: 'center' }}>
              <span data-i18n="tooltip.exportPng">PNG (Trong suốt)</span>
            </button>
            <button className="dl-format-btn btn" data-format="jpeg" style={{ justifyContent: 'center' }}>
              <span data-i18n="tooltip.exportJpeg">JPG (Nền trắng)</span>
            </button>
            <button className="dl-format-btn btn" data-format="webp" style={{ justifyContent: 'center' }}>
              WEBP
            </button>
            <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
            <button className="dl-format-btn btn" data-format="json" style={{ justifyContent: 'center', background: 'var(--color-success)' }}>
              <span data-i18n="tooltip.exportJson">JSON (Dự án)</span>
            </button>
          </div>
        </div>
      </div>

      <div id="custom-tooltip"></div>

    </>

  );

}



export default App;
