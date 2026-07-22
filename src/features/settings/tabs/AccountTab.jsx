import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../../../shared/ui/icons';
import { auth } from '../../auth/logic/firebase/config.js';
import { logout } from '../../auth/logic/auth-state.js';
import { getCurrentDirectoryHandle, clearLocalDirectory, pickLocalDirectory } from '../../storage/local/local-drive.js';
import { loginToDrive, logoutDrive, getDriveToken, setDriveToken } from '../../storage/cloud/drive-api.js';
import { t } from '../../../i18n/i18n.js';
import GoogleButton from '../../../shared/ui/GoogleButton.jsx';
import { loginWithGoogle } from '../../auth/logic/firebase/auth-api.js';

export default function AccountTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [localDirName, setLocalDirName] = useState(null);
  const [autoSaveDest, setAutoSaveDest] = useState(localStorage.getItem('auto_save_destination') || 'drive');
  const [driveEmail, setDriveEmail] = useState(sessionStorage.getItem('drive_user_email') || '');
  const [isDriveConnected, setIsDriveConnected] = useState(!!getDriveToken());

  const handleGoogle = async () => {
    try {
      const { user, driveToken } = await loginWithGoogle();
      if (driveToken) {
        setDriveToken(driveToken);
      }
    } catch (err) {
      alert(err.message || 'Lỗi đăng nhập bằng Google');
    }
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsDriveConnected(true);
      setDriveEmail(sessionStorage.getItem('drive_user_email') || '');
    };
    const handleDisconnect = () => {
      setIsDriveConnected(false);
      setDriveEmail('');
    };
    const handleEmailChange = (e) => {
      setDriveEmail(e.detail.email || '');
    };

    window.addEventListener('drive-connected', handleConnect);
    window.addEventListener('drive-disconnected', handleDisconnect);
    window.addEventListener('drive-user-email-changed', handleEmailChange);

    return () => {
      window.removeEventListener('drive-connected', handleConnect);
      window.removeEventListener('drive-disconnected', handleDisconnect);
      window.removeEventListener('drive-user-email-changed', handleEmailChange);
    };
  }, []);

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

  return (
    <div className="tab-content active" id="tab-account">
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

      <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('group.backupSync') || 'Lưu trữ & Đồng bộ'}</div>
        <div className="setting-group" style={{ marginBottom: '0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }} data-i18n="drive.sectionTitle">{t('drive.sectionTitle')}</h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-alt)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name={ICONS.CLOUD} style={{ color: isDriveConnected ? 'var(--success)' : 'var(--text-muted)' }} />
              <span id="driveStatusText" style={{ fontSize: '13px', color: isDriveConnected ? 'var(--success)' : 'var(--text-muted)' }}>
                {isDriveConnected 
                  ? `${t('status.driveConnected') || 'Đã kết nối Google Drive'}${driveEmail ? ` (${driveEmail})` : ''}` 
                  : (t('status.driveDisconnected') || 'Chưa kết nối')
                }
              </span>
            </div>
            {!isDriveConnected ? (
              <button id="driveLoginBtn" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={loginToDrive}>{t('drive.login') || 'Đăng nhập Drive'}</button>
            ) : (
              <button id="driveLogoutBtn" className="btn" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={logoutDrive}>{t('drive.logout') || 'Đăng xuất'}</button>
            )}
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
          <select
            value={autoSaveDest}
            onChange={(e) => {
              const val = e.target.value;
              setAutoSaveDest(val);
              localStorage.setItem('auto_save_destination', val);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="none">{t('settings.autoSaveDest.none') || 'Tắt tự động lưu ngoại tuyến'}</option>
            <option value="local">{t('settings.autoSaveDest.local') || 'Chỉ lưu vào Thư mục cục bộ'}</option>
            <option value="drive">{t('settings.autoSaveDest.drive') || 'Chỉ lưu vào Google Drive'}</option>
            <option value="both">{t('settings.autoSaveDest.both') || 'Lưu vào cả Thư mục cục bộ và Google Drive'}</option>
          </select>
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
  );
}