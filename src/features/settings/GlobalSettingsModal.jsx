import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../../shared/ui/icons';
import { CustomDropdown } from '../../shared/ui/CustomDropdown';
import DrawToolsTab from '../editor/ui/toolbar/DrawToolsTab.jsx';
import EditToolsTab from '../editor/ui/edit-panel/EditToolsTab.jsx';
import { t, getCurrentLang, setLang } from '../../i18n/i18n.js';
import { auth } from '../auth/logic/firebase/config.js';
import { logout } from '../auth/logic/auth-state.js';
import { getCurrentDirectoryHandle, clearLocalDirectory, pickLocalDirectory } from '../storage/local/local-drive.js';
import GoogleButton from '../../shared/ui/GoogleButton.jsx';
import { loginWithGoogle } from '../auth/logic/firebase/auth-api.js';
import KeyboardShortcutsTab from '../editor/ui/settings/KeyboardShortcutsTab.jsx';
import { getCanvasSettings, setCanvasSettings, applyCanvasSettings } from '../editor/engine/core/canvas-settings.js';
export default function GlobalSettingsModal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tabCounterVal, setTabCounterVal] = useState(1);
  const [activeTab, setActiveTab] = useState('tab-account');
  const [autoSaveDest, setAutoSaveDest] = useState(localStorage.getItem('auto_save_destination') || 'drive');
  const [localDirName, setLocalDirName] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [copiedClaude, setCopiedClaude] = useState(false);
  const [copiedCursor, setCopiedCursor] = useState(false);
  const [canvasMode, setCanvasMode] = useState(getCanvasSettings().mode);
  const [canvasCheckerColor, setCanvasCheckerColor] = useState(getCanvasSettings().checkerColor);
  const [canvasCheckerSize, setCanvasCheckerSize] = useState(getCanvasSettings().checkerSize);

  const mcpSessionId = aiStatus ? aiStatus.sessionId : (new URLSearchParams(window.location.search).get('mcp_session') || localStorage.getItem('pixel_mcp_session') || 'unknown-session');
  
  const claudeConfig = `{
  "mcpServers": {
    "pixel-normal-edit": {
      "command": "npx",
      "args": [
        "-y",
        "@pixel-normal-edit/mcp",
        "${mcpSessionId}"
      ]
    }
  }
}`;

  const cursorCommand = `npx -y @pixel-normal-edit/mcp "${mcpSessionId}"`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'claude') {
        setCopiedClaude(true);
        setTimeout(() => setCopiedClaude(false), 2000);
      } else {
        setCopiedCursor(true);
        setTimeout(() => setCopiedCursor(false), 2000);
      }
    });
  };

  useEffect(() => {
    const handleAiStatus = (e) => setAiStatus(e.detail);
    window.addEventListener('ai-connection-status', handleAiStatus);
    
    const sessionId = new URLSearchParams(window.location.search).get('mcp_session');
    if (sessionId) {
      setAiStatus({ type: 'waiting', sessionId });
    }
    
    return () => window.removeEventListener('ai-connection-status', handleAiStatus);
  }, []);

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert(err.message || 'Lỗi đăng nhập bằng Google');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          picture: user.photoURL
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleLocalDirChange = (e) => {
      setLocalDirName(e.detail.name);
    };
    window.addEventListener('local-dir-changed', handleLocalDirChange);
    const checkDir = async () => {
      const handle = getCurrentDirectoryHandle();
      if (handle) {
        setLocalDirName(handle.name);
      } else {
        setLocalDirName(null);
      }
    };
    checkDir();
    return () => window.removeEventListener('local-dir-changed', handleLocalDirChange);
  }, []);

  useEffect(() => {
    const themeSelect = document.getElementById('themeSelect');
    const customThemeSettings = document.getElementById('customThemeSettings');
    const customBgColor = document.getElementById('customBgColor');
    const customPrimaryColor = document.getElementById('customPrimaryColor');
    const customGridLineColor = document.getElementById('customGridLineColor');

    // Injects a dynamic <style> tag to override Dockview CSS variables AFTER the library's own
    // styles are loaded. This is needed because !important has no effect on CSS custom properties,
    // and Dockview's stylesheet is injected by the JS bundle (after style.css).
    const getDvStyle = () => {
      let s = document.getElementById('__theme-dv-override');
      if (!s) {
        s = document.createElement('style');
        s.id = '__theme-dv-override';
        document.head.appendChild(s);
      }
      return s;
    };

    const applyDvOverride = () => {
      // Read current resolved values from :root so we pick up whatever theme is active
      const root = getComputedStyle(document.documentElement);
      const bg = root.getPropertyValue('--color-bg').trim();
      const surface = root.getPropertyValue('--color-surface').trim();
      const border = root.getPropertyValue('--color-border').trim();
      const text = root.getPropertyValue('--color-text-bright').trim();
      const textMuted = root.getPropertyValue('--color-text-muted').trim();
      const primary = root.getPropertyValue('--color-primary').trim();

      getDvStyle().textContent = `
        .dockview-theme-dark, .dockview-theme-light {
          --dv-tabs-and-actions-container-background-color: ${surface};
          --dv-activegroup-visiblepanel-tab-background-color: ${bg};
          --dv-activegroup-hiddenpanel-tab-background-color: ${surface};
          --dv-inactivegroup-visiblepanel-tab-background-color: ${bg};
          --dv-inactivegroup-hiddenpanel-tab-background-color: ${surface};
          --dv-activegroup-visiblepanel-tab-color: ${text};
          --dv-activegroup-hiddenpanel-tab-color: ${textMuted};
          --dv-inactivegroup-visiblepanel-tab-color: ${textMuted};
          --dv-inactivegroup-hiddenpanel-tab-color: ${textMuted};
          --dv-group-view-background-color: ${bg};
          --dv-separator-border: ${border};
          --dv-tab-divider-color: ${border};
          --dv-active-sash-color: ${primary};
          --dv-paneview-header-border-color: ${border};
        }
      `;
    };

    const updateTheme = () => {
      if (!themeSelect) return;
      const theme = themeSelect.value;
      document.documentElement.setAttribute('data-theme', theme);

      if (theme === 'custom') {
        customThemeSettings.style.display = 'block';
        document.documentElement.style.setProperty('--custom-bg', customBgColor.value);
        document.documentElement.style.setProperty('--custom-primary', customPrimaryColor.value);

        // Add 33 for 20% opacity for the grid line
        const gridColor = customGridLineColor?.value || '#ffffff';
        document.documentElement.style.setProperty('--custom-grid-line', gridColor + '33');
      } else {
        customThemeSettings.style.display = 'none';
        document.documentElement.style.removeProperty('--custom-bg');
        document.documentElement.style.removeProperty('--custom-primary');
        document.documentElement.style.removeProperty('--custom-grid-line');
      }

      // Give the browser one frame to resolve the new CSS vars before reading them
      requestAnimationFrame(applyDvOverride);

      localStorage.setItem('pixel-edit-theme', theme);
      localStorage.setItem('pixel-edit-custom-bg', customBgColor.value);
      localStorage.setItem('pixel-edit-custom-primary', customPrimaryColor.value);
      if (customGridLineColor) {
        localStorage.setItem('pixel-edit-custom-grid-line', customGridLineColor.value);
      }
    };

    if (themeSelect) {
      const savedTheme = localStorage.getItem('pixel-edit-theme');
      if (savedTheme) {
        themeSelect.value = savedTheme;
        if (savedTheme === 'custom') {
          customBgColor.value = localStorage.getItem('pixel-edit-custom-bg') || '#191920';
          customPrimaryColor.value = localStorage.getItem('pixel-edit-custom-primary') || '#5b5bf0';
          if (customGridLineColor) {
            customGridLineColor.value = localStorage.getItem('pixel-edit-custom-grid-line') || '#ffffff';
          }
        }
        updateTheme();
      } else {
        // Apply Dockview override for the default dark theme on first load
        requestAnimationFrame(applyDvOverride);
      }

      themeSelect.addEventListener('change', updateTheme);
      customBgColor.addEventListener('input', updateTheme);
      customPrimaryColor.addEventListener('input', updateTheme);
      if (customGridLineColor) {
        customGridLineColor.addEventListener('input', updateTheme);
      }
    }

    const showBtnNamesToggle = document.getElementById('showBtnNamesToggle');
    const updateShowNames = () => {
      if (!showBtnNamesToggle) return;
      const isChecked = showBtnNamesToggle.checked;
      localStorage.setItem('pixel-edit-show-btn-names', isChecked);
      if (isChecked) {
        document.documentElement.classList.add('show-btn-names');
      } else {
        document.documentElement.classList.remove('show-btn-names');
      }
    };

    if (showBtnNamesToggle) {
      const savedShowNames = localStorage.getItem('pixel-edit-show-btn-names') === 'true';
      showBtnNamesToggle.checked = savedShowNames;
      if (savedShowNames) {
        document.documentElement.classList.add('show-btn-names');
      } else {
        document.documentElement.classList.remove('show-btn-names');
      }
      showBtnNamesToggle.addEventListener('change', updateShowNames);
    }

    const animationsToggle = document.getElementById('animationsToggle');
    const updateAnimations = () => {
      if (!animationsToggle) return;
      const isChecked = animationsToggle.checked;
      localStorage.setItem('pixel-edit-animations-enabled', isChecked);
      if (isChecked) {
        document.documentElement.classList.add('animations-enabled');
      } else {
        document.documentElement.classList.remove('animations-enabled');
      }
    };

    if (animationsToggle) {
      const savedAnimations = localStorage.getItem('pixel-edit-animations-enabled');
      // Default to true if not set
      const isEnabled = savedAnimations === null ? true : savedAnimations === 'true';
      animationsToggle.checked = isEnabled;
      if (isEnabled) {
        document.documentElement.classList.add('animations-enabled');
      } else {
        document.documentElement.classList.remove('animations-enabled');
      }
      animationsToggle.addEventListener('change', updateAnimations);
    }

    return () => {
      if (themeSelect) {
        themeSelect.removeEventListener('change', updateTheme);
        customBgColor.removeEventListener('input', updateTheme);
        customPrimaryColor.removeEventListener('input', updateTheme);
      }
      if (showBtnNamesToggle) {
        showBtnNamesToggle.removeEventListener('change', updateShowNames);
      }
      if (animationsToggle) {
        animationsToggle.removeEventListener('change', updateAnimations);
      }
    };
  }, []);

  return (
    <div id="globalSettingsModal" className="modal-overlay" style={{ display: 'none', zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '18px' }}>{t('modal.settingsTitle') || 'Cài đặt chung'}</h3>
          <button className="btn" style={{ padding: '4px' }} onClick={() => document.getElementById('globalSettingsModal').style.display = 'none'}>
            <Icon name={ICONS.X} />
          </button>
        </div>

        <div className="modal-tabs" style={{ flexWrap: 'wrap' }}>
          <button className={`tab-btn ${activeTab === 'tab-account' ? 'active' : ''}`} data-tab="tab-account" onClick={() => setActiveTab('tab-account')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.USER} style={{ width: '18px', height: '18px' }} />
              <span>{t('modal.tabAccount') || 'Tài khoản'}</span>
            </div>
          </button>
          <button className={`tab-btn ${activeTab === 'tab-appearance' ? 'active' : ''}`} data-tab="tab-appearance" onClick={() => setActiveTab('tab-appearance')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.PALETTE} style={{ width: '18px', height: '18px' }} />
              <span>{t('modal.tabAppearance') || 'Giao diện'}</span>
            </div>
          </button>
          <button className={`tab-btn ${activeTab === 'tab-draw-tools' ? 'active' : ''}`} data-tab="tab-draw-tools" onClick={() => setActiveTab('tab-draw-tools')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.PEN_TOOL} style={{ width: '18px', height: '18px' }} />
              <span>{t('modal.tabDrawTools') || 'Công cụ vẽ'}</span>
            </div>
          </button>
          <button className={`tab-btn ${activeTab === 'tab-edit-tools' ? 'active' : ''}`} data-tab="tab-edit-tools" onClick={() => setActiveTab('tab-edit-tools')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.SETTINGS_2} style={{ width: '18px', height: '18px' }} />
              <span>{t('modal.tabEditTools') || 'Thao tác'}</span>
            </div>
          </button>
          <button className={`tab-btn ${activeTab === 'tab-shortcuts' ? 'active' : ''}`} data-tab="tab-shortcuts" onClick={() => setActiveTab('tab-shortcuts')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.KEYBOARD} style={{ width: '18px', height: '18px' }} />
              <span>{t('modal.tabShortcuts') || 'Phím tắt'}</span>
            </div>
          </button>
        </div>
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '4px', paddingRight: '8px' }}>
          <div className={`tab-content ${activeTab === 'tab-appearance' ? 'active' : ''}`} id="tab-appearance" style={{ display: activeTab === 'tab-appearance' ? 'block' : 'none' }}>
            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.language') || 'Ngôn ngữ (Language)'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CustomDropdown
                  id="languageSelect"
                  defaultValue={getCurrentLang()}
                  onChange={(e) => {
                    setLang(e.target.value);
                    window.location.reload();
                  }}
                  options={[
                    { value: 'vi', label: t('settings.langVietnamese') },
                    { value: 'en', label: t('settings.langEnglish') }
                  ]}
                />
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('theme.title') || 'Giao diện (Theme)'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CustomDropdown
                  id="themeSelect"
                  defaultValue={localStorage.getItem('pixel-edit-theme') || 'dark'}
                  options={[
                    { value: 'dark', label: t('theme.dark') || 'Tối (Dark)' },
                    { value: 'light', label: t('theme.light') || 'Sáng (Light)' },
                    { value: 'custom', label: t('theme.custom') || 'Tùy chỉnh (Custom)' }
                  ]}
                />

                <div id="customThemeSettings" style={{ display: 'none', padding: '16px', background: 'var(--color-surface-alt)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customBgColor">{t('theme.bg') || 'Nền (Bg)'}</label>
                    <input type="color" id="customBgColor" defaultValue="#191920" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customPrimaryColor">{t('theme.primary') || 'Nhấn (Primary)'}</label>
                    <input type="color" id="customPrimaryColor" defaultValue="#5b5bf0" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customGridLineColor">{t('theme.gridLine') || 'Lưới (Grid)'}</label>
                    <input type="color" id="customGridLineColor" defaultValue="#ffffff" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('canvas.checkerboard') || 'Checkerboard (Nền ô vuông)'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CustomDropdown
                  id="canvasCheckerMode"
                  value={canvasMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setCanvasMode(mode);
                    setCanvasSettings({ mode });
                    applyCanvasSettings();
                  }}
                  options={[
                    { value: 'default', label: t('canvas.default') || 'Mặc định' },
                    { value: 'custom', label: t('canvas.custom') || 'Tùy chỉnh' }
                  ]}
                />

                {canvasMode === 'custom' && (
                  <div style={{ padding: '16px', background: 'var(--color-surface-alt)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="canvasCheckerColor">{t('canvas.checkerColor') || 'Màu checkerboard'}</label>
                      <input 
                        type="color" 
                        id="canvasCheckerColor" 
                        value={canvasCheckerColor}
                        onChange={(e) => {
                          setCanvasCheckerColor(e.target.value);
                          setCanvasSettings({ checkerColor: e.target.value });
                          applyCanvasSettings();
                        }}
                        style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="canvasCheckerSize">{t('canvas.checkerSize') || 'Kích thước checkerboard'}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" 
                          id="canvasCheckerSize" 
                          min="1" 
                          max="20" 
                          value={canvasCheckerSize}
                          onChange={(e) => {
                            const size = parseInt(e.target.value, 10);
                            setCanvasCheckerSize(size);
                            setCanvasSettings({ checkerSize: size });
                            applyCanvasSettings();
                          }}
                          style={{ width: '60px', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.penShapeTitle') || 'Hình dạng bút vẽ'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CustomDropdown
                  id="globalPenShape"
                  defaultValue="circle"
                  options={[
                    { value: 'circle', label: t('label.shapeCircle') || 'Tròn (Circle)' },
                    { value: 'square', label: t('label.shapeSquare') || 'Vuông (Square)' }
                  ]}
                />
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.display') || 'Hiển thị'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" id="showBtnNamesToggle" className="check" />
                  <span>{t('settings.showBtnNames') || 'Hiển thị tên công cụ dưới biểu tượng'}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" id="animationsToggle" defaultChecked className="check" />
                  <span>{t('settings.animations') || 'Bật hiệu ứng chuyển động (Animations)'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'tab-account' ? 'active' : ''}`} id="tab-account" style={{ display: activeTab === 'tab-account' ? 'block' : 'none' }}>
            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.accountTitle') || 'Tài khoản Pixel Normal Edit'}</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} id="pixelAccountInfo">
                    <img src={currentUser?.picture || undefined} alt="" style={{ display: (currentUser && currentUser.picture) ? 'block' : 'none', width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ display: (currentUser && currentUser.picture) ? 'none' : 'block' }}>
                      <Icon name={ICONS.USER} style={{ color: 'var(--text-muted)', width: '24px', height: '24px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span id="pixelAccountName" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }} data-i18n={currentUser ? null : "auth.notLoggedIn"}>{currentUser ? currentUser.name : (t('auth.notLoggedIn') || 'Chưa đăng nhập')}</span>
                      <span id="pixelAccountEmail" style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }} data-i18n={currentUser ? null : "auth.loginToSync"}>{currentUser ? currentUser.email : (t('auth.loginToSync') || 'Vui lòng đăng nhập để đồng bộ')}</span>
                    </div>
                  </div>
                  {currentUser ? (
                    <button id="pixelLogoutBtn" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--color-danger)' }} onClick={async () => {
                      await logout();
                      document.getElementById('globalSettingsModal').style.display = 'none';
                    }} data-i18n="auth.logout">{t('auth.logout') || 'Đăng xuất'}</button>
                  ) : (
                    <div style={{ minWidth: '200px' }}>
                      <GoogleButton onCredential={handleGoogle} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.aiConnection') || 'Kết nối AI (MCP)'}</div>
              
              <div className="setting-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.CODE} style={{ color: aiStatus ? 'var(--success)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: aiStatus ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500 }}>
                      {aiStatus && aiStatus.type === 'connected' ? (t('status.mcpConnected') || 'Trạng thái: đã kết nối mcp') : (t('status.mcpWaiting') || 'Đang chờ kết nối...')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px' }}>
                    Session: {mcpSessionId}
                  </div>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.mcpOptionA') || 'Tùy chọn A: Dành cho Claude Desktop'}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.5' }}>
                  {t('settings.mcpOptionADesc') || 'Thêm cấu hình này vào file claude_desktop_config.json của bạn:'}
                </p>
                <div style={{ position: 'relative' }}>
                  <pre style={{ background: 'var(--color-surface-alt)', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', border: '1px solid var(--color-border)', margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    <code>{claudeConfig}</code>
                  </pre>
                  <button 
                    className="btn btn-primary" 
                    style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px', background: copiedClaude ? 'var(--success)' : 'var(--color-primary)' }}
                    onClick={() => copyToClipboard(claudeConfig, 'claude')}
                  >
                    {copiedClaude ? (t('btn.copied') || 'Đã copy!') : (t('btn.copy') || 'Copy')}
                  </button>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.mcpOptionB') || 'Tùy chọn B: Dành cho Cursor (Dạng lệnh Terminal)'}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.5' }}>
                  {t('settings.mcpOptionBDesc') || 'Chạy lệnh này trong Terminal để khởi động máy chủ MCP:'}
                </p>
                <div style={{ position: 'relative' }}>
                  <pre style={{ background: 'var(--color-surface-alt)', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', border: '1px solid var(--color-border)', margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingRight: '70px' }}>
                    <code>{cursorCommand}</code>
                  </pre>
                  <button 
                    className="btn btn-primary" 
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '8px', padding: '4px 8px', fontSize: '11px', background: copiedCursor ? 'var(--success)' : 'var(--color-primary)' }}
                    onClick={() => copyToClipboard(cursorCommand, 'cursor')}
                  >
                    {copiedCursor ? (t('btn.copied') || 'Đã copy!') : (t('btn.copy') || 'Copy')}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('group.backupSync') || 'Lưu trữ & Đồng bộ'}</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }} data-i18n="drive.sectionTitle">{t('drive.sectionTitle')}</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.CLOUD} style={{ color: 'var(--text-muted)' }} />
                    <span id="driveStatusText" style={{ fontSize: '13px', color: 'var(--text-muted)' }} data-i18n="status.driveDisconnected">{t('status.driveDisconnected') || 'Chưa kết nối'}</span>
                  </div>
                  <button id="driveLoginBtn" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={async () => {
                    const { loginToDrive } = await import('../storage/cloud/drive-api.js');
                    await loginToDrive();
                  }}>{t('drive.login') || 'Đăng nhập Drive'}</button>
                  <button id="driveLogoutBtn" className="btn" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={async () => {
                    const { logoutDrive } = await import('../storage/cloud/drive-api.js');
                    await logoutDrive();
                  }}>{t('drive.logout') || 'Đăng xuất'}</button>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.localDirectory') || 'Thư mục cục bộ'}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {t('settings.localDirectoryDesc') || 'Cấp quyền để ứng dụng lưu file trực tiếp vào máy mà không cần hộp thoại tải xuống.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Icon name={ICONS.FOLDER} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: localDirName ? 'var(--success)' : 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>
                      {localDirName ? localDirName : <span>{t('settings.noDirectorySelected') || 'Chưa chọn thư mục nào'}</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {localDirName && (
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--color-danger)', color: 'white' }} onClick={() => {
                        clearLocalDirectory();
                        setLocalDirName(null);
                      }} data-i18n="settings.clearDirectory">{t('settings.clearDirectory') || "Xóa cấu hình"}</button>
                    )}
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={async () => {
                      const handle = await pickLocalDirectory();
                      if (handle) {
                        setLocalDirName(handle.name);
                      }
                    }}>
                      <span data-i18n={localDirName ? "settings.changeDirectory" : "settings.selectDirectory"}>
                        {localDirName ? (t('settings.changeDirectory') || "Thay đổi thư mục") : (t('settings.selectDirectory') || "Chọn thư mục")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.autoSaveDest') || 'Nơi lưu tự động (Auto Save)'}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {t('settings.autoSaveDestDesc') || 'Hệ thống sẽ tự động đồng bộ file của bạn theo chu kỳ 5 giây mỗi khi có thay đổi.'}
                </p>
                <CustomDropdown
                  value={autoSaveDest}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAutoSaveDest(val);
                    localStorage.setItem('auto_save_destination', val);
                  }}
                  options={[
                    { value: 'none', label: t('settings.autoSaveDest.none') || 'Tắt tự động lưu ngoại tuyến' },
                    { value: 'local', label: t('settings.autoSaveDest.local') || 'Chỉ lưu vào Thư mục cục bộ' },
                    { value: 'drive', label: t('settings.autoSaveDest.drive') || 'Chỉ lưu vào Google Drive' },
                    { value: 'both', label: t('settings.autoSaveDest.both') || 'Lưu vào cả Thư mục cục bộ và Google Drive' }
                  ]}
                />
              </div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-danger)' }}>{t('troubleshoot.title') || 'Khắc phục sự cố'}</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                  {t('troubleshoot.desc') || 'Nếu ứng dụng bị lỗi hoặc kẹt, bạn có thể xóa toàn bộ dữ liệu cục bộ để khôi phục lại trạng thái ban đầu.'}
                </p>
                <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }} onClick={() => {
                  if (window.confirm(t('confirm.resetAllData'))) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}>{t('troubleshoot.reset') || 'Khôi phục dữ liệu gốc (Reset)'}</button>
              </div>
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'tab-draw-tools' ? 'active' : ''}`} id="tab-draw-tools" style={{ display: activeTab === 'tab-draw-tools' ? 'block' : 'none' }}>
            <DrawToolsTab />
          </div>

          <div className={`tab-content ${activeTab === 'tab-edit-tools' ? 'active' : ''}`} id="tab-edit-tools" style={{ display: activeTab === 'tab-edit-tools' ? 'block' : 'none' }}>
            <EditToolsTab />
          </div>

          <div className={`tab-content ${activeTab === 'tab-shortcuts' ? 'active' : ''}`} id="tab-shortcuts" style={{ display: activeTab === 'tab-shortcuts' ? 'block' : 'none' }}>
            <KeyboardShortcutsTab />
          </div>
        </div>
      </div>
    </div>
  );
}


