import { getDriveToken, downloadImageFromDrive, listDriveFiles, initGoogleDrive, loginToDrive, logoutDrive, uploadToDrive, openDrivePicker } from './drive-api.js';
import { getCurrentDirectoryHandle, listLocalFiles, readLocalFile } from '../local/local-drive.js';
import { getActiveTabId, getTabs, switchTab, createNewTab, renameTab } from '../../editor/engine/core/tab-manager.js';
import { generateWorkspacePngBlob } from '../../editor/io/export/export-png.js';
import { generateWorkspaceJpegBlob } from '../../editor/io/export/export-jpeg.js';
import { generateWorkspaceWebpBlob } from '../../editor/io/export/export-webp.js';
import { generateWorkspaceJsonBlob } from '../../editor/io/export/export-json.js';
import { handleImageFile, handleJsonFile } from '../../editor/io/upload/upload-modal.js';
import { t } from '../../../i18n/i18n.js';

function showNotification(msg, isError = false) {
  let toast = document.getElementById('drive-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'drive-toast';
    toast.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px);
      background: var(--surface-2); color: var(--text-primary);
      padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px ;
      font-size: 14px; font-weight: 500; z-index: 999999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid var(--border);
    `;
    document.body.appendChild(toast);
  }
  toast.style.borderLeft = isError ? '4px solid #ff4444' : '4px solid var(--success)';
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  
  if (toast.timeout) clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 3000);
}

export function setupDriveUI() {
  initGoogleDrive();

  const driveLoginBtn = document.getElementById('driveLoginBtn');
  const driveLogoutBtn = document.getElementById('driveLogoutBtn');
  const driveStatusText = document.getElementById('driveStatusText');
  const driveFileModal = document.getElementById('driveFileModal');
  const driveFileList = document.getElementById('driveFileList');

  const driveHeaderIcon = document.getElementById('driveHeaderIcon');
  const driveHeaderStatus = document.getElementById('driveHeaderStatus');

  let driveUserEmail = "";

  if (getDriveToken()) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('drive-connected', { detail: { accessToken: getDriveToken() } }));
    }, 100);
  }

  // Handle connection events
  window.addEventListener('drive-connected', async (e) => {
    const accessToken = e.detail?.accessToken;
    if (accessToken) {
      try {
        const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.emailAddress) {
            driveUserEmail = data.user.emailAddress;
            sessionStorage.setItem('drive_user_email', driveUserEmail);
            window.dispatchEvent(new CustomEvent('drive-user-email-changed', { detail: { email: driveUserEmail } }));
          }
        }
      } catch (err) {
        console.warn("Could not fetch drive user info", err);
      }
    }

    if (driveStatusText) {
      driveStatusText.innerHTML = (t('status.driveConnected') || "Đã kết nối Google Drive") + 
                                  (driveUserEmail ? `<br><span style="font-size:12px; color:var(--text-primary);">${driveUserEmail}</span>` : "");
      driveStatusText.style.color = 'var(--success)';
    }
    if (driveHeaderIcon) {
      driveHeaderIcon.style.color = 'var(--success)';
    }
    if (driveHeaderStatus) {
      driveHeaderStatus.title = driveUserEmail ? `Google Drive Connected (${driveUserEmail})` : `Google Drive Connected`;
    }
    if (driveLoginBtn) driveLoginBtn.style.display = 'none';
    if (driveLogoutBtn) driveLogoutBtn.style.display = 'block';

    showNotification(t('status.driveConnected') || "Đã kết nối Google Drive");

    // If source-drive is active, reload list
    const activeSourceBtn = document.querySelector('.source-btn.active');
    if (activeSourceBtn && activeSourceBtn.dataset.source === 'drive') {
      loadDriveFileList();
    }
  });

  window.addEventListener('drive-disconnected', () => {
    driveUserEmail = "";
    sessionStorage.removeItem('drive_user_email');
    window.dispatchEvent(new CustomEvent('drive-user-email-changed', { detail: { email: "" } }));
    if (driveStatusText) {
      driveStatusText.textContent = t('status.driveDisconnected') || "Chưa kết nối";
      driveStatusText.style.color = 'var(--text-muted)';
    }
    if (driveHeaderIcon) {
      driveHeaderIcon.style.color = 'var(--text-muted)';
    }
    if (driveHeaderStatus) {
      driveHeaderStatus.title = t('drive.disconnectedTitle');
    }
    if (driveLoginBtn) driveLoginBtn.style.display = 'block';
    if (driveLogoutBtn) driveLogoutBtn.style.display = 'none';

    // Reset drive list view if open
    const driveUploadList = document.getElementById('driveUploadList');
    if (driveUploadList) {
      driveUploadList.innerHTML = `
        <div style="text-align: center; padding: 30px 20px; color: var(--text-muted); background: var(--surface-1); border-radius: 8px; border: 1px dashed var(--border);">
           <i data-lucide="hard-drive" style="width: 36px; height: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
           <div style="margin-bottom: 12px;" data-i18n="drive.loginRequired">${t('drive.loginRequired')}</div>
           <button id="uploadDriveLoginBtn" class="btn btn-primary" style="padding: 8px 16px;" data-i18n="drive.login">${t('drive.login')}</button>
        </div>
      `;
      const btn = document.getElementById('uploadDriveLoginBtn');
      if (btn) btn.addEventListener('click', loginToDrive);
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Attach button events
  if (driveLoginBtn) driveLoginBtn.addEventListener('click', loginToDrive);
  if (driveLogoutBtn) driveLogoutBtn.addEventListener('click', logoutDrive);
  
  // Note: saveToDriveBtn event logic has been moved to main.js for batch export

  const sourceBtns = document.querySelectorAll('.source-btn');
  const sourceLocalContent = document.getElementById('source-local-content');
  const sourceDriveContent = document.getElementById('source-drive-content');
  const sourceLocalDirContent = document.getElementById('source-local-dir-content');
  const autoSizeLabel = document.getElementById('autoSizeLabel');

  sourceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sourceBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--text-muted)';
      });
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      targetBtn.style.background = 'var(--surface-1)';
      targetBtn.style.color = 'var(--text-primary)';

      const source = targetBtn.dataset.source;
      
      if (sourceLocalContent) sourceLocalContent.style.display = 'none';
      if (sourceDriveContent) sourceDriveContent.style.display = 'none';
      if (sourceLocalDirContent) sourceLocalDirContent.style.display = 'none';
      
      if (source === 'local-dir') {
        if (sourceLocalDirContent) {
          sourceLocalDirContent.style.display = 'block';
          sourceLocalDirContent.classList.remove('tab-pane-transition');
          void sourceLocalDirContent.offsetWidth;
          sourceLocalDirContent.classList.add('tab-pane-transition');
        }
        if (autoSizeLabel) autoSizeLabel.style.display = 'flex';
        loadLocalDirFileList();
      } else {
        if (sourceDriveContent) {
          sourceDriveContent.style.display = 'block';
          sourceDriveContent.classList.remove('tab-pane-transition');
          void sourceDriveContent.offsetWidth;
          sourceDriveContent.classList.add('tab-pane-transition');
        }
        if (autoSizeLabel) autoSizeLabel.style.display = 'none';
        loadDriveFileList();
      }
    });
  });

  const uploadDriveLoginBtn = document.getElementById('uploadDriveLoginBtn');
  if (uploadDriveLoginBtn) uploadDriveLoginBtn.addEventListener('click', loginToDrive);

  const openDrivePickerBtn = document.getElementById('openDrivePickerBtn');
  if (openDrivePickerBtn) {
    openDrivePickerBtn.addEventListener('click', () => {
      try {
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) uploadModal.style.display = 'none'; // Ẩn ngay lập tức để không che Picker

        openDrivePicker(async (fileId, fileName, mimeType) => {
          try {
            openDrivePickerBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 16px; height: 16px;"></i> ${t('status.loading')}`;
            if (window.lucide) window.lucide.createIcons();
            
            const imgBlob = await downloadImageFromDrive(fileId);
            
            const newTabId = createNewTab();
            switchTab(newTabId);
            
            const baseName = fileName.replace(/\.(png|jpg|jpeg|webp|json)$/i, '');
            if (baseName) renameTab(newTabId, baseName);
            
            const isJson = fileName.toLowerCase().endsWith('.json') || mimeType === 'application/json';
            
            const tabs = getTabs();
            const newTab = tabs.find(t => t.id === newTabId);
            if (newTab) {
              newTab.storage = { type: 'drive', id: fileId, handle: null, name: fileName };
              newTab.format = isJson ? 'json' : 'png';
            }
            
            if (isJson) {

              const jsonFile = new File([imgBlob], fileName, { type: 'application/json' });
              handleJsonFile(jsonFile);
              showNotification(t('drive.projectLoaded', fileName));
            } else {
              const imgFile = new File([imgBlob], fileName, { type: imgBlob.type || 'image/png' });
              handleImageFile(imgFile, true);
              showNotification(t('drive.imageLoaded', fileName));
            }
            
          } catch (err) {
            showNotification(err.message, true);
          } finally {
            openDrivePickerBtn.innerHTML = `<i data-lucide="search" style="width: 16px; height: 16px;"></i><span data-i18n="drive.openPicker">${t('drive.openPicker') || 'Duyệt toàn bộ Drive...'}</span>`;
            if (window.lucide) window.lucide.createIcons();
          }
        }, () => {
          // Bắt sự kiện Cancel
          const uploadModal = document.getElementById('uploadModal');
          if (uploadModal) uploadModal.style.display = 'flex'; // Hiện lại
        });
      } catch (err) {
        showNotification(err.message, true);
      }
    });
  }
}

export async function loadDriveFileList() {
    const driveUploadList = document.getElementById('driveUploadList');
    if (!driveUploadList) return;

    if (!getDriveToken()) {
      // Not logged in
      return;
    }

    try {
      driveUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);"><i data-lucide="loader-2" class="spin"></i> ${t('drive.loadingList')}</div>`;
      if (window.lucide) window.lucide.createIcons();
      
      const files = await listDriveFiles();
      if (files.length === 0) {
        driveUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">${t('drive.noFiles') || "Không tìm thấy file nào trên Drive"}</div>`;
        return;
      }

      driveUploadList.style.display = 'grid';
      driveUploadList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
      driveUploadList.style.gap = '12px';
      driveUploadList.innerHTML = '';
      
      files.forEach(file => {
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex; flex-direction: column; align-items: center; 
          padding: 8px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
          transition: background 0.2s; position: relative;
        `;
        item.onmouseover = () => item.style.background = 'var(--surface-1)';
        item.onmouseout = () => item.style.background = 'transparent';
        
        const date = new Date(file.modifiedTime).toLocaleDateString();
        
        const isJson = file.name.toLowerCase().endsWith('.json');
        const defaultIcon = isJson ? 'file-json-2' : 'image';
        
        let imgHtml;
        if (file.thumbnailLink && !isJson) {
          imgHtml = `<img src="${file.thumbnailLink}" referrerpolicy="no-referrer"
            onerror="this.onerror=null; this.outerHTML='<div style=\\'width: 100%; aspect-ratio: 1; background: var(--surface-1); display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border-radius: 4px;\\'><i data-lucide=\\'${defaultIcon}\\' style=\\'color: var(--text-muted);\\'></i></div>'; if(window.lucide) window.lucide.createIcons();" 
            style="width: 100%; aspect-ratio: 1; object-fit: contain; margin-bottom: 8px; border-radius: 4px; background: var(--surface-1);" />`;
        } else {
          imgHtml = `<div style="width: 100%; aspect-ratio: 1; background: var(--surface-1); display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border-radius: 4px;"><i data-lucide="${defaultIcon}" style="color: var(--text-muted); width: 32px; height: 32px;"></i></div>`;
        }
          
        item.innerHTML = `
          ${imgHtml}
          <div style="font-size: 12px; font-weight: 500; color: var(--text-primary); text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</div>
          <div style="font-size: 10px; color: var(--text-muted); text-align: center;">${date}</div>
        `;
        
        item.addEventListener('click', async () => {
          try {
            item.style.opacity = '0.5';
            const imgBlob = await downloadImageFromDrive(file.id);
            const uploadModal = document.getElementById('uploadModal');
            if (uploadModal) uploadModal.style.display = 'none';
            
            const newTabId = createNewTab();
            switchTab(newTabId);
            
            const baseName = file.name.replace(/\.(png|jpg|jpeg|webp|json)$/i, '');
            if (baseName) {
              renameTab(newTabId, baseName);
            }
            
            // Cập nhật tab.storage cho tab mới
            const tabs = getTabs();
            const newTab = tabs.find(t => t.id === newTabId);
            if (newTab) {
              newTab.storage = { type: 'drive', id: file.id, handle: null, name: file.name };
              newTab.format = isJson ? 'json' : 'png';
            }
            
            if (file.name.toLowerCase().endsWith('.json')) {

              const jsonFile = new File([imgBlob], file.name, { type: 'application/json' });
              handleJsonFile(jsonFile);
              showNotification(t('drive.projectLoaded', file.name));
            } else {
              const imgFile = new File([imgBlob], file.name, { type: imgBlob.type || 'image/png' });
              handleImageFile(imgFile, true);
              showNotification(t('drive.imageLoaded', file.name));
            }
            
          } catch (err) {
            showNotification(err.message, true);
            item.style.opacity = '1';
          }
        });
        
        driveUploadList.appendChild(item);
      });
      if (window.lucide) window.lucide.createIcons();
      
    } catch (err) {
      driveUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-danger);">${err.message}</div>`;
    }
}

export async function loadLocalDirFileList() {
    const localDirUploadList = document.getElementById('localDirUploadList');
    if (!localDirUploadList) return;

    const handle = getCurrentDirectoryHandle();
    if (!handle) {
      // Show default "not configured" message which is already in HTML
      return;
    }

    try {
      localDirUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);"><i data-lucide="loader-2" class="spin"></i> ${t('drive.loadingList')}</div>`;
      if (window.lucide) window.lucide.createIcons();
      
      const files = await listLocalFiles();
      if (files.length === 0) {
        localDirUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">${t('local.noFilesFound')}</div>`;
        return;
      }

      localDirUploadList.style.display = 'grid';
      localDirUploadList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
      localDirUploadList.style.gap = '12px';
      localDirUploadList.innerHTML = '';
      
      files.forEach(file => {
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex; flex-direction: column; align-items: center; 
          padding: 8px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
          transition: background 0.2s; position: relative;
        `;
        item.onmouseover = () => item.style.background = 'var(--surface-1)';
        item.onmouseout = () => item.style.background = 'transparent';
        
        const date = new Date(file.lastModified).toLocaleDateString();
        const defaultIcon = file.isJson ? 'file-json-2' : 'image';
        
        const imgContainerId = 'local-img-' + Math.random().toString(36).substr(2, 9);
        const imgHtml = `<div id="${imgContainerId}" style="width: 100%; aspect-ratio: 1; background: var(--surface-1); display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border-radius: 4px;"><i data-lucide="${defaultIcon}" style="color: var(--text-muted); width: 32px; height: 32px;"></i></div>`;
          
        item.innerHTML = `
          ${imgHtml}
          <div style="font-size: 12px; font-weight: 500; color: var(--text-primary); text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">${file.name}</div>
          <div style="font-size: 10px; color: var(--text-muted); text-align: center;">${date}</div>
        `;
        
        item.addEventListener('click', async () => {
          try {
            item.style.opacity = '0.5';
            const fileBlob = await readLocalFile(file.handle);
            
            const uploadModal = document.getElementById('uploadModal');
            if (uploadModal) uploadModal.style.display = 'none';
            
            const newTabId = createNewTab();
            switchTab(newTabId);
            
            const baseName = file.name.replace(/\.(png|jpg|jpeg|webp|json)$/i, '');
            if (baseName) {
              renameTab(newTabId, baseName);
            }
            
            // Cập nhật tab.storage cho tab mới
            const tabs = getTabs();
            const newTab = tabs.find(t => t.id === newTabId);
            if (newTab) {
              newTab.storage = { type: 'local', id: null, handle: file.handle, name: file.name };
              newTab.format = file.isJson ? 'json' : 'png';
            }
            
            if (file.isJson) {

              handleJsonFile(fileBlob);
              showNotification(t('local.projectOpened', file.name));
            } else {
              handleImageFile(fileBlob, true);
              showNotification(t('local.imageOpened', file.name));
            }
            
          } catch (err) {
            showNotification(err.message, true);
            item.style.opacity = '1';
          }
        });
        
        localDirUploadList.appendChild(item);
        
        // Load thumbnail asynchronously
        if (!file.isJson) {
          file.handle.getFile().then(blob => {
            const url = URL.createObjectURL(blob);
            const container = document.getElementById(imgContainerId);
            if (container) {
              container.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" onload="URL.revokeObjectURL(this.src)" />`;
            }
          }).catch(err => console.error("Thumbnail load error:", err));
        }
      });
      if (window.lucide) window.lucide.createIcons();
      
    } catch (err) {
      localDirUploadList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-danger);">${err.message}</div>`;
    }
  }

export async function exportToDrive(tab, format) {
  let blob;
  let ext = '';
  
  if (format === 'png') {
    blob = await generateWorkspacePngBlob(tab);
    ext = 'png';
  } else if (format === 'jpeg') {
    blob = await generateWorkspaceJpegBlob(tab);
    ext = 'jpg';
  } else if (format === 'webp') {
    blob = await generateWorkspaceWebpBlob(tab);
    ext = 'webp';
  } else if (format === 'json') {
    blob = generateWorkspaceJsonBlob(tab);
    ext = 'json';
  } else {
    throw new Error('Unsupported format');
  }

  const fileName = `${tab.name || 'pixel-art'}.${ext}`;
  const fileId = await uploadToDrive(fileName, blob, tab.driveFileId);
  if (!tab.driveFileId) tab.driveFileId = fileId;
  return fileId;
}

export { showNotification };