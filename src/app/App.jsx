import { Icon, ICONS } from '../shared/ui/icons';
import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { auth } from '../features/auth/logic/firebase/config.js';
import { mcpClient } from '../features/editor/api/mcp-firebase-client.js';

import { initEditor } from '../features/editor/engine/main.js';
import { initCanvasSettings } from '../features/editor/engine/core/canvas-settings.js';

import { pixelMap } from '../features/editor/engine/core/state.js';

import { DockviewReact } from 'dockview-react';

import 'dockview-core/dist/styles/dockview.css';

import { t } from '../i18n/i18n.js';
import { reloadLucideIcons } from '../shared/dom/lucide-utils.jsx';
import { initPopupBehavior } from '../shared/dom/popup-controller';



import ToolbarPanel from '../features/editor/ui/toolbar/ToolbarPanel.jsx';
import DrawToolsTab from '../features/editor/ui/toolbar/DrawToolsTab.jsx';

import CanvasPanel from '../features/editor/ui/panels/CanvasPanel.jsx';

import EditPanel from '../features/editor/ui/edit-panel/EditPanel.jsx';
import GlobalSettingsModal from '../features/settings/GlobalSettingsModal.jsx';
const CropModal = lazy(() => import('../features/editor/ui/crop/CropModal.jsx'));
const ResizeModal = lazy(() => import('../features/editor/ui/resize/ResizeModal.jsx'));
const UserInputModal = lazy(() => import('../features/editor/ui/modals/UserInputModal.jsx'));
import UploadModal from '../features/editor/ui/modals/UploadModal.jsx';
import DownloadModal from '../features/editor/ui/modals/DownloadModal.jsx';
const LoginPage = lazy(() => import('../features/auth/ui/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../features/auth/ui/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../features/auth/ui/ForgotPasswordPage.jsx'));
import { getCurrentUser, logout } from '../features/auth/logic/auth-state.js';
import { setupDriveUI } from '../features/storage/cloud/drive-ui.js';



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

  const checkIsDesktop = () => {
    return window.innerWidth > 768 || window.matchMedia('(max-height: 500px) and (orientation: landscape)').matches;
  };

  const [isDesktop, setIsDesktop] = useState(checkIsDesktop());

  const AUTH_ROUTES = ['login', 'register', 'forgot-password'];
  const getRoute = () => window.location.hash.replace('#', '');
  const [route, setRoute] = useState(getRoute());
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [aiStatus, setAiStatus] = useState(null); // Trạng thái AI: { type: 'connected'|'drawing', text: '...' }

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRoute();
      setRoute(newRoute);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (AUTH_ROUTES.includes(route)) {
      navigate('');
    }
  }, [route]);

  useEffect(() => {
    // Re-initialize icons when switching routes or rendering
    reloadLucideIcons(50);

    // Hide custom tooltip to prevent it from getting stuck when element unmounts
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) tooltip.classList.remove('show');
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserState({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          picture: user.photoURL || null
        });

        // Tự động gán Session ID của MCP thành UID của tài khoản Google
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('mcp_session', user.uid);
        window.history.replaceState({}, '', newUrl.toString());
        
        if (mcpClient.commandBus) {
          mcpClient.initialize(mcpClient.commandBus, user.uid);
          window.dispatchEvent(new CustomEvent('ai-connection-status', {
            detail: { type: 'waiting', text: t('mcpFirebase.waiting'), sessionId: user.uid }
          }));
        }
      } else {
        setCurrentUserState(null);
      }
    });
    return () => unsubscribe();
  }, []);



  useEffect(() => {

    const handleResize = () => setIsDesktop(checkIsDesktop());

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);

  useEffect(() => {
    const handleAiStatus = (e) => {
      setAiStatus(e.detail);
    };
    window.addEventListener('ai-connection-status', handleAiStatus);
    return () => window.removeEventListener('ai-connection-status', handleAiStatus);
  }, []);



  useEffect(() => {

    if (isInit.current) return;

    isInit.current = true;

    setTimeout(() => {

      initEditor();

    }, 100);

  }, []);

  useEffect(() => {
    // Initialize canvas settings (checkerboard customization)
    initCanvasSettings();
  }, []);

  useEffect(() => {
    setupDriveUI();
  }, []);



  const onReady = (event) => {
    let loaded = false;
    try {
      const savedLayout = localStorage.getItem('dockview_layout');
      if (savedLayout) {
        event.api.fromJSON(JSON.parse(savedLayout));
        loaded = true;
      }
    } catch (e) {
      console.warn('Failed to load dockview layout:', e);
      localStorage.removeItem('dockview_layout');
    }

    if (!loaded) {
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

      requestAnimationFrame(() => {
        try {
          toolbarPanel.api.setSize({ width: 150 });
          settingsPanel.api.setSize({ width: 220 });
        } catch (_) { }
      });
    }

    event.api.onDidLayoutChange(() => {
      try {
        localStorage.setItem('dockview_layout', JSON.stringify(event.api.toJSON()));
      } catch (e) { }
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
        <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'var(--text-muted)'}}><Icon name={ICONS.LOADER} className="spin" style={{width: 24, height: 24, marginRight: 8}}/>{t('status.loading')}</div>}>
          {route === 'login' ? (
            <LoginPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />
          ) : route === 'register' ? (
            <RegisterPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />
          ) : (
            <ForgotPasswordPage onNavigate={navigate} />
          )}
        </Suspense>
      ) : (
      <div className="container">

        <div className="header">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/avatar.svg"
                alt="Pixel Normal Edit Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '7px',
                  flexShrink: 0,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 0 0 1px rgba(135,206,235,0.15)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(135,206,235,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(135,206,235,0.15)'; }}
                onClick={() => { window.location.href = '/?tool=home'; }}
              />
              <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>{t('app.title') || "Pixel Normal Edit"}</h1>
              
              {aiStatus && aiStatus.type === 'connected' && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '11px', 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    background: 'var(--success, #2e7d32)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace'
                  }} 
                  title={t('mcpFirebase.statusTitle')}
                >
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: '#a5d6a7',
                    display: 'inline-block'
                  }}></span>
                  <span>{t('status.mcpConnected') || 'Trạng thái: đã kết nối mcp'}</span>
                </div>
              )}

              <button 
                className="btn" 
                style={{ padding: '4px', display: 'flex', alignItems: 'center' }} 
                onClick={() => document.getElementById('globalSettingsModal').style.display = 'flex'}
                title={t('tooltip.settings')}
              >
                <Icon name={ICONS.SETTINGS} style={{ width: '20px', height: '20px', color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'none' }}>{t('app.desc') || "Pixel Normal Edit"}</span>

          </div>

          <div className="header-actions">


            <button id="toggleToolsBtn" className="btn btn-primary mobile-only" title={t('tooltip.toggleTools') || "Toggle Tools"}>

              <Icon name={ICONS.MENU} style={{ width: '18px', height: '18px' }} />

              <span>{t('text.showTools') || "Mở công cụ"}</span>

            </button>

            <button id="openUploadModalBtn" className="btn" title={t('tooltip.uploadFull') || "Upload"}>

              <Icon name={ICONS.UPLOAD} style={{ width: '18px', height: '18px' }} />

              <span>{t('btn.upload') || "Tải lên"}</span>

            </button>


            <button id="openDownloadModalBtn" className="btn btn-primary" style={{ background: 'var(--success)' }} title={t('btn.saveAs') || "Lưu dưới dạng..."} onClick={() => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); document.getElementById('downloadModal').style.display = 'flex'; }}>
              <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
              <span>{t('btn.saveAs') || "Lưu dưới dạng..."}</span>
            </button>
            
            <div id="saveStatusIndicator" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', opacity: 0.7 }}>
              {/* Status will be updated via JS */}
            </div>

            <button className="btn desktop-only undo-btn-action" title={t('tooltip.undo') || "Undo"}><Icon name={ICONS.UNDO} style={{ width: '18px', height: '18px' }} /></button>

            <button className="btn desktop-only redo-btn-action" data-i18n="tooltip.redo"><Icon name={ICONS.REDO} style={{ width: '18px', height: '18px' }} /></button>



            <button id="loginBtn" className="btn avatar-btn" data-i18n="tooltip.login" title={currentUser ? currentUser.name || currentUser.email : ''} onClick={(e) => {
              e.preventDefault();
              const modal = document.getElementById('globalSettingsModal');
              if (modal) {
                 document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
                 modal.style.display = 'flex';
                 // Automatically switch to account tab
                 const accTab = modal.querySelector('.modal-tabs [data-tab="tab-account"]');
                 if (accTab) accTab.click();
              }
            }}>

              <img src={currentUser?.picture || undefined} alt="" className="avatar-img" style={{ display: (currentUser && currentUser.picture) ? 'block' : 'none' }} />
              <div className="avatar-placeholder" style={{ display: (currentUser && currentUser.picture) ? 'none' : 'flex' }}>
                <Icon name={ICONS.USER} style={{ width: '18px', height: '18px', color: 'var(--text-primary)' }} />
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



      <Suspense fallback={null}>
        <UploadModal />
        <DownloadModal />
      </Suspense>



      <div id="custom-tooltip"></div>

      {/* Global Settings Modal */}
      <Suspense fallback={null}>
        <GlobalSettingsModal />
        <CropModal />
        <ResizeModal />
        <UserInputModal />
      </Suspense>

    </>

  );

}



export default App;
