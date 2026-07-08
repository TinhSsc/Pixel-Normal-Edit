import { Icon, ICONS } from './components/icons';
import { useEffect, useRef, useState } from 'react';

import { initEditor } from './js/main.js';

import { pixelMap } from './js/core/state.js';

import { DockviewReact } from 'dockview-react';

import 'dockview-core/dist/styles/dockview.css';

import { t } from './js/lang/i18n.js';



import ToolbarPanel from './toolbar/ToolbarPanel.jsx';
import DrawToolsTab from './toolbar/DrawToolsTab.jsx';

import CanvasPanel from './panels/CanvasPanel.jsx';

import EditPanel from './edit/EditPanel.jsx';
import GlobalSettingsModal from './settings/GlobalSettingsModal.jsx';
import CropModal from './components/crop/CropModal.jsx';
import ResizeModal from './components/resize/ResizeModal.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import { getCurrentUser, logout } from './js/auth/auth-state.js';
import { setupDriveUI } from './js/services/drive-ui.js';



const components = {

  toolbar: ToolbarPanel,

  canvas: CanvasPanel,

  settings: EditPanel,

};

const tabComponents = {
  canvasTab: (props) => <div id="canvasTabsReactBridge" style={{ display: 'flex', height: '100%', width: '100%', flex: 1 }}></div>
};

function App() {

  const isInit = useRef(false);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  const AUTH_ROUTES = ['login', 'register', 'forgot-password'];
  const getRoute = () => window.location.hash.replace('#', '');
  const [route, setRoute] = useState(getRoute());
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRoute();
      setRoute(newRoute);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!currentUser && !AUTH_ROUTES.includes(route)) {
      navigate('login');
    }
  }, [route, currentUser]);

  useEffect(() => {
    // Re-initialize icons when switching routes or rendering
    const timer = setTimeout(() => {
      if (window.lucide) window.lucide.createIcons();
    }, 50);
    
    // Hide custom tooltip to prevent it from getting stuck when element unmounts
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) tooltip.classList.remove('show');
    
    return () => clearTimeout(timer);
  }, [route, currentUser]);

  const navigate = (path) => {
    window.location.hash = path;
  };

  const handleLoggedIn = (user) => {
    // Tải lại trang hoàn toàn để khởi tạo lại toàn bộ script Canvas
    window.location.href = window.location.pathname;
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    import('./js/firebase/config.js').then(({ auth }) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setCurrentUserState({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            picture: user.photoURL || null
          });
        } else {
          setCurrentUserState(null);
        }
      });
      return () => unsubscribe();
    }).catch(console.error);
  }, []);



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

  useEffect(() => {
    setupDriveUI();
  }, []);



  const onReady = (event) => {

    const canvasPanel = event.api.addPanel({

      id: 'canvas',

      component: 'canvas',

      tabComponent: 'canvasTab',

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
      clearTimeout(wrapper._hideTimer);
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
        let delay = 0;
        if (wrapper.dataset.clicked === 'true' || wrapper.contains(document.activeElement)) {
          delay = 3000;
        }

        wrapper._hideTimer = setTimeout(() => {
          wrapper.dataset.clicked = 'false';
          popup.style.display = '';
          popup.style.position = '';
          popup.style.zIndex = '';
          popup.style.top = '';
          popup.style.left = '';
          popup.style.right = '';
          
          if (wrapper._updatePosition && wrapper._scrollContainer) {
            wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
          }
        }, delay);
      }
    };

    const handleClick = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      wrapper.dataset.clicked = 'true';
      clearTimeout(wrapper._hideTimer);
    };

    // Use a small timeout to let elements mount properly
    const timer = setTimeout(() => {
      const wrappers = document.querySelectorAll('.header .tool-with-popup-bottom');
      wrappers.forEach(w => {
        w.addEventListener('mouseenter', handleMouseEnter);
        w.addEventListener('mouseleave', handleMouseLeave);
        w.addEventListener('click', handleClick);
      });
    }, 100);

    const handleClickOutside = (e) => {
      const wrappers = document.querySelectorAll('.header .tool-with-popup-bottom');
      wrappers.forEach(wrapper => {
        if (wrapper.dataset.clicked === 'true' && !wrapper.contains(e.target)) {
          wrapper.dataset.clicked = 'false';
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
        }
      });
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      const wrappers = document.querySelectorAll('.header .tool-with-popup-bottom');
      wrappers.forEach(w => {
        w.removeEventListener('mouseenter', handleMouseEnter);
        w.removeEventListener('mouseleave', handleMouseLeave);
        w.removeEventListener('click', handleClick);
      });
    };
  }, []);


  return (

    <>

      {AUTH_ROUTES.includes(route) ? (
        route === 'login' ? (
          <LoginPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />
        ) : route === 'register' ? (
          <RegisterPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />
        ) : (
          <ForgotPasswordPage onNavigate={navigate} />
        )
      ) : (
      <div className="container">

        <div className="header">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-bright)' }} data-i18n="app.title">Pixel Normal Edit</h1>
              <button 
                className="btn" 
                style={{ background: 'transparent', border: 'none', padding: '4px', display: 'flex', alignItems: 'center' }} 
                onClick={() => document.getElementById('globalSettingsModal').style.display = 'flex'}
                title="Cài đặt"
              >
                <Icon name={ICONS.SETTINGS} style={{ width: '20px', height: '20px', color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'none' }} data-i18n="app.desc">Pixel Normal Edit</span>

          </div>

          <div className="header-actions">


            <button id="toggleToolsBtn" className="btn btn-primary mobile-only" data-i18n="tooltip.toggleTools">

              <Icon name={ICONS.MENU} style={{ width: '18px', height: '18px' }} />

              <span data-i18n="text.showTools">Mở công cụ</span>

            </button>

            <button id="openUploadModalBtn" className="btn" data-i18n="tooltip.uploadFull">

              <Icon name={ICONS.UPLOAD} style={{ width: '18px', height: '18px' }} />

              <span data-i18n="btn.upload">Tải lên</span>

            </button>


            <button id="openDownloadModalBtn" className="btn btn-primary" style={{ background: 'var(--color-success)' }} data-i18n="btn.saveAs" onClick={() => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); document.getElementById('downloadModal').style.display = 'flex'; }}>
              <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="btn.saveAs">Lưu dưới dạng...</span>
            </button>
            
            <div id="saveStatusIndicator" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '8px', opacity: 0.7 }}>
              {/* Status will be updated via JS */}
            </div>

            <button className="btn desktop-only undo-btn-action" data-i18n="tooltip.undo"><Icon name={ICONS.UNDO} style={{ width: '18px', height: '18px' }} /></button>

            <button className="btn desktop-only redo-btn-action" data-i18n="tooltip.redo"><Icon name={ICONS.REDO} style={{ width: '18px', height: '18px' }} /></button>



            <button id="loginBtn" className="btn avatar-btn" data-i18n="tooltip.login" title={currentUser ? currentUser.name || currentUser.email : ''} onClick={(e) => {
              e.preventDefault();
              if (currentUser) {
                const modal = document.getElementById('globalSettingsModal');
                if (modal) {
                   document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
                   modal.style.display = 'flex';
                   // Automatically switch to account tab
                   const accTab = modal.querySelector('.modal-tabs [data-tab="tab-account"]');
                   if (accTab) accTab.click();
                }
                return;
              }

              if (pixelMap && pixelMap.size > 0) {
                if (!window.confirm(t('confirm.leave') || "Bạn có chắc chuyển sang nơi khác? Mọi dữ liệu bản vẽ chưa lưu sẽ bị mất!")) {
                  return;
                }
              }
              navigate('login');
            }}>

              <img src={currentUser?.picture || undefined} alt="" className="avatar-img" style={{ display: (currentUser && currentUser.picture) ? 'block' : 'none' }} />
              <div className="avatar-placeholder" style={{ display: (currentUser && currentUser.picture) ? 'none' : 'flex' }}>
                <Icon name={ICONS.USER} style={{ width: '18px', height: '18px', color: 'var(--color-text-bright)' }} />
              </div>
            </button>

          </div>

        </div>



        {isDesktop ? (

          <div className="editor-layout" style={{ position: 'relative' }}>

            <DockviewReact

              components={components}

              tabComponents={tabComponents}

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

            <EditPanel />

          </div>

        )}

      </div>
      )}



        {/* Upload Modal */}
      <div id="uploadModal" className="modal-overlay" style={{ display: 'none' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ margin: 0, fontSize: '18px' }} data-i18n="modal.uploadTitle">Tải dữ liệu lên</h3>
            <button id="closeUploadModalBtn" className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }}><Icon name={ICONS.X} /></button>
          </div>

          <div className="modal-tabs">
            <button className="tab-btn active" data-tab="tab-image">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icon name={ICONS.IMAGE} style={{ width: '18px', height: '18px' }} />
                <span data-i18n="modal.tabImage">Ảnh (PNG/JPG)</span>
              </div>
            </button>
            <button className="tab-btn" data-tab="tab-json">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icon name={ICONS.FILE_JSON} style={{ width: '18px', height: '18px' }} />
                <span data-i18n="modal.tabJson">Dữ liệu (JSON)</span>
              </div>
            </button>
          </div>

          <div className="tab-content active" id="tab-image">
            <div className="source-tabs">
               <button className="source-btn active" data-source="local-dir">
                 <Icon name={ICONS.MONITOR} style={{ width: '16px', height: '16px' }} /> <span data-i18n="modal.tabComputer">Máy tính</span>
               </button>
               <button className="source-btn" data-source="drive">
                 <Icon name={ICONS.HARD_DRIVE} style={{ width: '16px', height: '16px' }} /> <span data-i18n="modal.tabDrive">Google Drive</span>
               </button>
            </div>
            
            <label id="autoSizeLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-bright)', cursor: 'pointer', margin: '10px 0 20px', fontWeight: 500 }}>
              <input type="checkbox" id="autoSizeOnUpload" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
              <span data-i18n="modal.autoSize">Tự động chỉnh lưới theo kích thước ảnh</span>
            </label>
            
            <div id="source-local-dir-content" style={{ minHeight: '180px' }}>
              <div id="imageDropZone" className="drag-drop-zone" style={{ marginBottom: '16px', padding: '16px', minHeight: 'auto', borderStyle: 'solid', borderWidth: '1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name={ICONS.UPLOAD_CLOUD} style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="modal.clickToSelect">Nhấp hoặc kéo thả file để tải lên</span>
                </div>
                <input type="file" id="imageUploadModal" accept="image/*" style={{ display: 'none' }} />
              </div>

              <div id="localDirUploadList" style={{ width: '100%', height: '100%', maxHeight: '45vh', overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                   <Icon name={ICONS.FOLDER} style={{ width: '36px', height: '36px', marginBottom: '12px', opacity: 0.5 }} />
                   <div style={{ marginBottom: '12px' }} data-i18n="settings.noDirectorySelected">Bạn chưa cấu hình Thư mục cục bộ</div>
                   <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => {
                     document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
                     document.getElementById('globalSettingsModal').style.display = 'flex';
                     setTimeout(() => {
                        const accountBtn = document.querySelector('.tab-btn[data-tab="tab-account"]');
                        if (accountBtn) accountBtn.click();
                     }, 50);
                   }} data-i18n="settings.changeDirectory">Đi tới Cài đặt</button>
                </div>
              </div>
            </div>
            
            <div id="source-drive-content" style={{ display: 'none', minHeight: '180px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button id="openDrivePickerBtn" className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name={ICONS.SEARCH} style={{ width: '16px', height: '16px' }} />
                  <span data-i18n="drive.openPicker">Duyệt toàn bộ Drive...</span>
                </button>
              </div>
              <div id="driveUploadList" style={{ width: '100%', height: '100%', maxHeight: '45vh', overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                   <Icon name={ICONS.CLOUD} style={{ width: '36px', height: '36px', marginBottom: '12px', opacity: 0.5 }} />
                   <div style={{ marginBottom: '12px' }}>Bạn cần đăng nhập Google Drive để chọn ảnh</div>
                   <button id="uploadDriveLoginBtn" className="btn btn-primary" style={{ padding: '8px 16px' }}>Kết nối Drive</button>
                </div>
              </div>
            </div>
          </div>

          <div className="tab-content" id="tab-json">
            <textarea id="jsonInputText" data-i18n="modal.jsonPlaceholder" placeholder="Dán mã JSON (hoặc nội dung file .txt) vào đây..."
              style={{ width: '100%', height: '140px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-bright)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', resize: 'vertical', marginBottom: '16px', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            ></textarea>
            
            <button id="parseJsonTextBtn" className="btn btn-primary" style={{ width: '100%', marginBottom: '24px', padding: '12px', fontSize: '15px', fontWeight: 500 }}>
              <Icon name={ICONS.CODE} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="modal.parseJson">Nhập từ Text</span>
            </button>

            <div id="jsonDropZone" className="drag-drop-zone" style={{ padding: '30px 20px' }}>
              <Icon name={ICONS.FILE_JSON} style={{ width: '36px', height: '36px', color: 'var(--color-success)', marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="modal.dropJson">Hoặc kéo thả file .json vào đây</div>
              <input type="file" id="jsonUploadModal" accept=".json, .txt, application/json, text/plain" style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <div id="downloadModal" className="modal-overlay" style={{ display: 'none' }}>
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, fontSize: '18px' }} data-i18n="modal.downloadTitle">Tải xuống</h3>
            <button id="closeDownloadModalBtn" className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }}><Icon name={ICONS.X} /></button>
          </div>
          <div style={{ padding: '20px' }}>
            
            {/* Bước 1: Chọn Canvas */}
            <div className="download-section" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '10px' }} data-i18n="download.step1">1. Chọn tệp (Canvas)</label>
              <div id="downloadCanvasList" className="download-canvas-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'var(--color-surface-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                {/* Checkboxes will be injected here via JS */}
              </div>
            </div>
            
            {/* Bước 2: Chọn Định dạng */}
            <div className="download-section" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '10px' }} data-i18n="download.step2">2. Định dạng xuất</label>
              <div className="download-options-grid format-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button className="dl-format-btn select-btn active" data-format="png" style={{ flexDirection: 'column', padding: '12px 8px', alignItems: 'center' }}>
                  <Icon name={ICONS.IMAGE} style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>PNG</span>
                </button>
                <button className="dl-format-btn select-btn" data-format="jpeg" style={{ flexDirection: 'column', padding: '12px 8px', alignItems: 'center' }}>
                  <Icon name={ICONS.IMAGE} style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>JPG</span>
                </button>
                <button className="dl-format-btn select-btn" data-format="webp" style={{ flexDirection: 'column', padding: '12px 8px', alignItems: 'center' }}>
                  <Icon name={ICONS.IMAGE} style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>WEBP</span>
                </button>
                <button className="dl-format-btn select-btn" data-format="json" style={{ flexDirection: 'column', padding: '12px 8px', alignItems: 'center' }}>
                  <Icon name={ICONS.FILE_JSON} style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>JSON</span>
                </button>
              </div>
            </div>

            {/* Bước 3: Nơi lưu */}
            <div className="download-section" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '10px' }} data-i18n="download.step3">3. Nơi lưu trữ</label>
              <div className="download-options-grid dest-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button className="dl-dest-btn select-btn active" data-dest="local" style={{ padding: '12px', justifyContent: 'center' }}>
                  <Icon name={ICONS.MONITOR_DOWN} style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }} data-i18n="download.local">Lưu vào máy</span>
                </button>
                <button className="dl-dest-btn select-btn" data-dest="drive" style={{ padding: '12px', justifyContent: 'center' }}>
                  <Icon name={ICONS.HARD_DRIVE_UPLOAD} style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }} data-i18n="download.drive">Google Drive</span>
                </button>
              </div>
            </div>

            {/* Bước 4: Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
               <button id="executeDownloadBtn" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
                 <span style={{ fontWeight: 600 }} data-i18n="download.execute">Tiến hành tải xuống</span>
               </button>
            </div>

          </div>
        </div>
      </div>



      <div id="custom-tooltip"></div>

      {/* Grid Resize Prompt Modal */}
      <div id="gridResizeModal" className="modal-overlay" style={{ display: 'none', zIndex: 999999 }}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, fontSize: '18px' }} data-i18n="resizePopover.title">Thay đổi kích thước</h3>
            <button className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }} onClick={() => document.getElementById('gridResizeModal').style.display = 'none'}>
              <Icon name={ICONS.X} />
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '16px' }}><span data-i18n="resizeModal.questionPrefix">Bạn muốn xử lý ảnh hiện tại như thế nào khi chuyển sang </span><span id="newGridSizeLabel" style={{ fontWeight: 'bold' }}></span>?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button id="resizeKeepBtn" className="btn select-btn" style={{ padding: '12px', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', height: 'auto' }}>
                <Icon name={ICONS.CROP} style={{ width: '20px', height: '20px', color: 'var(--color-text-bright)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-bright)' }} data-i18n="resizeModal.keepTitle">Giữ nguyên ảnh</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.keepDesc">Mở rộng hoặc cắt bớt không gian, không làm biến dạng ảnh</span>
                </div>
              </button>
              <button id="resizeScaleBtn" className="btn select-btn" style={{ padding: '12px', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', height: 'auto' }}>
                <Icon name={ICONS.MAXIMIZE} style={{ width: '20px', height: '20px', color: 'var(--color-text-bright)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-bright)' }} data-i18n="resizeModal.scaleTitle">Thu phóng ảnh</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.scaleDesc">Co giãn toàn bộ hình ảnh cho vừa khít với kích thước mới</span>
                </div>
              </button>
              <button id="resizeClearBtn" className="btn select-btn" style={{ padding: '12px', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', height: 'auto' }}>
                <Icon name={ICONS.TRASH_2} style={{ width: '20px', height: '20px', color: 'var(--color-danger)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-danger)' }} data-i18n="resizeModal.clearTitle">Xoá mất ảnh</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }} data-i18n="resizeModal.clearDesc">Tạo một trang giấy trắng hoàn toàn mới</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Settings Modal */}
      <GlobalSettingsModal />
      <CropModal />
      <ResizeModal />

    </>

  );

}



export default App;
