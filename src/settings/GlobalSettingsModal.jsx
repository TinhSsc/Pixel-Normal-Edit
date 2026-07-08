import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../components/icons';
import DrawToolsTab from '../toolbar/DrawToolsTab.jsx';
import EditToolsTab from '../edit/EditToolsTab.jsx';
import { t } from '../js/lang/i18n.js';

export default function GlobalSettingsModal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tabCounterVal, setTabCounterVal] = useState(1);
  const [autoSaveDest, setAutoSaveDest] = useState(localStorage.getItem('auto_save_destination') || 'drive');
  const [localDirName, setLocalDirName] = useState(null);

  useEffect(() => {
    import('../js/firebase/config.js').then(({ auth }) => {
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
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleLocalDirChange = (e) => {
      setLocalDirName(e.detail.name);
    };
    window.addEventListener('local-dir-changed', handleLocalDirChange);
    
    import('../js/services/local-drive.js').then(({ getCurrentDirectoryHandle }) => {
      const handle = getCurrentDirectoryHandle();
      if (handle) setLocalDirName(handle.name);
    });

    return () => window.removeEventListener('local-dir-changed', handleLocalDirChange);
  }, []);

  return (
    <div id="globalSettingsModal" className="modal-overlay" style={{ display: 'none', zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '18px' }} data-i18n="modal.settingsTitle">Cài đặt chung</h3>
          <button className="btn" style={{ background: 'transparent', border: 'none', padding: '4px' }} onClick={() => document.getElementById('globalSettingsModal').style.display = 'none'}>
            <Icon name={ICONS.X} />
          </button>
        </div>

        <div className="modal-tabs" style={{ flexWrap: 'wrap' }}>
          <button className="tab-btn active" data-tab="tab-appearance">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.PALETTE} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="modal.tabAppearance">Giao diện</span>
            </div>
          </button>
          <button className="tab-btn" data-tab="tab-draw-tools">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.PEN_TOOL} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="modal.tabDrawTools">Công cụ vẽ</span>
            </div>
          </button>
          <button className="tab-btn" data-tab="tab-edit-tools">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.SETTINGS_2} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="modal.tabEditTools">Thao tác</span>
            </div>
          </button>
          <button className="tab-btn" data-tab="tab-account">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name={ICONS.USER} style={{ width: '18px', height: '18px' }} />
              <span data-i18n="modal.tabAccount">Tài khoản</span>
            </div>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
          <div className="tab-content active" id="tab-appearance">
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="theme.title">Giao diện (Theme)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <select id="themeSelect" className="select-dropdown">
                    <option value="dark" data-i18n="theme.dark">Tối (Dark)</option>
                    <option value="light" data-i18n="theme.light">Sáng (Light)</option>
                    <option value="custom" data-i18n="theme.custom">Tùy chỉnh (Custom)</option>
                  </select>
                  <Icon name={ICONS.CHEVRON_DOWN} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                </div>

                <div id="customThemeSettings" style={{ display: 'none', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', cursor: 'pointer' }} htmlFor="customBgColor" data-i18n="theme.bg">Nền (Bg)</label>
                    <input type="color" id="customBgColor" defaultValue="#191920" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', cursor: 'pointer' }} htmlFor="customPrimaryColor" data-i18n="theme.primary">Nhấn (Primary)</label>
                    <input type="color" id="customPrimaryColor" defaultValue="#5b5bf0" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', cursor: 'pointer' }} htmlFor="customGridLineColor" data-i18n="theme.gridLine">Lưới (Grid)</label>
                    <input type="color" id="customGridLineColor" defaultValue="#ffffff" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="settings.penShapeTitle">Hình dạng bút vẽ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <select id="globalPenShape" className="select-dropdown" defaultValue="circle">
                    <option value="circle" data-i18n="label.shapeCircle">Tròn (Circle)</option>
                    <option value="square" data-i18n="label.shapeSquare">Vuông (Square)</option>
                  </select>
                  <Icon name={ICONS.CHEVRON_DOWN} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="settings.display">Hiển thị</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-bright)', cursor: 'pointer' }}>
                  <input type="checkbox" id="showBtnNamesToggle" style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  <span data-i18n="settings.showBtnNames">Hiển thị tên công cụ dưới biểu tượng</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-bright)', cursor: 'pointer' }}>
                  <input type="checkbox" id="animationsToggle" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  <span data-i18n="settings.animations">Bật hiệu ứng chuyển động (Animations)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="tab-content" id="tab-account">
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }}>Tài khoản Pixel Normal Edit</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} id="pixelAccountInfo">
                    <img src={currentUser?.picture || undefined} alt="" style={{ display: (currentUser && currentUser.picture) ? 'block' : 'none', width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ display: (currentUser && currentUser.picture) ? 'none' : 'block' }}>
                      <Icon name={ICONS.USER} style={{ color: 'var(--color-text-muted)', width: '24px', height: '24px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span id="pixelAccountName" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-bright)' }}>{currentUser ? currentUser.name : 'Chưa đăng nhập'}</span>
                      <span id="pixelAccountEmail" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{currentUser ? currentUser.email : 'Vui lòng đăng nhập để đồng bộ'}</span>
                    </div>
                  </div>
                  {currentUser && (
                    <button id="pixelLogoutBtn" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--color-danger)' }} onClick={() => {
                      import('../js/auth/auth-state.js').then(({ logout }) => {
                        logout();
                        document.getElementById('globalSettingsModal').style.display = 'none';
                      });
                    }}>Đăng xuất</button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-bright)' }} data-i18n="group.backupSync">Lưu trữ & Đồng bộ</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text)' }}>Google Drive</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.CLOUD} style={{ color: 'var(--color-text-muted)' }} />
                    <span id="driveStatusText" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }} data-i18n="status.driveDisconnected">Chưa kết nối</span>
                  </div>
                  <button id="driveLoginBtn" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} data-i18n="drive.login">Đăng nhập Drive</button>
                  <button id="driveLogoutBtn" className="btn" style={{ padding: '6px 12px', fontSize: '13px', display: 'none' }} data-i18n="drive.logout">Đăng xuất</button>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text)' }} data-i18n="settings.localDirectory">Thư mục cục bộ</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }} data-i18n="settings.localDirectoryDesc">
                  Cấp quyền để ứng dụng lưu file trực tiếp vào máy mà không cần hộp thoại tải xuống.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Icon name={ICONS.FOLDER} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '13px', color: localDirName ? 'var(--color-success)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>
                      {localDirName ? localDirName : <span data-i18n="settings.noDirectorySelected">Chưa chọn thư mục nào</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {localDirName && (
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--color-danger)', color: 'white' }} onClick={() => {
                        import('../js/services/local-drive.js').then(({ clearLocalDirectory }) => clearLocalDirectory());
                      }} data-i18n="settings.clearDirectory">{t('settings.clearDirectory') || "Xóa cấu hình"}</button>
                    )}
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => {
                      import('../js/services/local-drive.js').then(({ pickLocalDirectory }) => pickLocalDirectory());
                    }}>
                      <span data-i18n={localDirName ? "settings.changeDirectory" : "settings.selectDirectory"}>
                        {localDirName ? (t('settings.changeDirectory') || "Thay đổi thư mục") : (t('settings.selectDirectory') || "Chọn thư mục")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text)' }} data-i18n="settings.autoSaveDest">Nơi lưu tự động (Auto Save)</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }} data-i18n="settings.autoSaveDestDesc">
                  Hệ thống sẽ tự động đồng bộ file của bạn theo chu kỳ 5 giây mỗi khi có thay đổi.
                </p>
                <select 
                  value={autoSaveDest} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setAutoSaveDest(val);
                    localStorage.setItem('auto_save_destination', val);
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-bright)', fontSize: '13px', outline: 'none' }}
                >
                  <option value="none" data-i18n="settings.autoSaveDest.none">Tắt tự động lưu ngoại tuyến</option>
                  <option value="local" data-i18n="settings.autoSaveDest.local">Chỉ lưu vào Thư mục cục bộ</option>
                  <option value="drive" data-i18n="settings.autoSaveDest.drive">Chỉ lưu vào Google Drive</option>
                  <option value="both" data-i18n="settings.autoSaveDest.both">Lưu vào cả Thư mục cục bộ và Google Drive</option>
                </select>
              </div>
            </div>
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--color-danger)' }} data-i18n="troubleshoot.title">Khắc phục sự cố</div>
              <div className="setting-group" style={{ marginBottom: '0' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: '1.5' }} data-i18n="troubleshoot.desc">
                  Nếu ứng dụng bị lỗi hoặc kẹt, bạn có thể xóa toàn bộ dữ liệu cục bộ để khôi phục lại trạng thái ban đầu.
                </p>
                <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }} onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Mọi ảnh và thiết lập chưa lưu sẽ bị mất, ứng dụng sẽ tải lại.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }} data-i18n="troubleshoot.reset">
                  Khôi phục dữ liệu gốc (Reset)
                </button>
              </div>
            </div>
          </div>

          <div className="tab-content" id="tab-draw-tools">
            <DrawToolsTab />
          </div>

          <div className="tab-content" id="tab-edit-tools">
            <EditToolsTab />
          </div>
        </div>
      </div>
    </div>
  );
}
