const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let accessToken = null;
let appFolderId = null;

export function initGoogleDrive() {
  if (typeof google === 'undefined') {
    console.error('Google Identity Services script not loaded');
    return;
  }
  
  if (!CLIENT_ID) {
    console.error('Missing VITE_GOOGLE_CLIENT_ID in .env');
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        accessToken = tokenResponse.access_token;
        localStorage.setItem('drive_was_logged_in', 'true');
        window.dispatchEvent(new CustomEvent('drive-connected', { detail: { accessToken } }));
      }
    },
  });

  if (localStorage.getItem('drive_was_logged_in') === 'true') {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

export function loginToDrive() {
  if (!tokenClient) initGoogleDrive();
  
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: '' }); // Or 'consent' if we want to force re-auth
  } else {
    alert("Google Identity Services failed to initialize.");
  }
}

export function getDriveToken() {
  return accessToken;
}

export function logoutDrive() {
  if (accessToken) {
    if (typeof google !== 'undefined') {
      google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null;
        localStorage.removeItem('drive_was_logged_in');
        window.dispatchEvent(new CustomEvent('drive-disconnected'));
      });
    } else {
      accessToken = null;
      localStorage.removeItem('drive_was_logged_in');
      window.dispatchEvent(new CustomEvent('drive-disconnected'));
    }
  }
}

export function ensureDriveLogin(onReady) {
  if (getDriveToken()) {
    return onReady();
  }
  
  const handler = () => {
    window.removeEventListener('drive-connected', handler);
    onReady();
  };
  
  window.addEventListener('drive-connected', handler);
  loginToDrive();
}

async function getOrCreateAppFolder() {
  if (appFolderId) return appFolderId;
  
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='Pixel Normal Edit' and trashed=false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    appFolderId = searchData.files[0].id;
    return appFolderId;
  }
  
  // Create folder
  const metadata = {
    name: 'Pixel Normal Edit',
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  const createData = await createRes.json();
  appFolderId = createData.id;
  return appFolderId;
}

export async function uploadToDrive(fileName, fileBlob, fileId = null) {
  if (!accessToken) throw new Error("Not logged in to Google Drive");

  const metadata = {
    name: fileName,
    mimeType: 'image/png',
  };
  
  if (!fileId) {
    const folderId = await getOrCreateAppFolder();
    metadata.parents = [folderId];
  }
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
  const method = fileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Lỗi khi upload file lên Drive");
  }

  const data = await res.json();
  return data.id;
}

export async function listDriveFiles() {
  if (!accessToken) throw new Error("Not logged in to Google Drive");

  const query = encodeURIComponent("mimeType='image/png' and trashed=false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,thumbnailLink)`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Lỗi khi lấy danh sách file từ Drive");
  }

  const data = await res.json();
  return data.files;
}

export async function downloadFromDrive(fileId) {
  if (!accessToken) throw new Error("Not logged in to Google Drive");

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Lỗi khi tải file từ Drive");
  }

  const json = await res.text();
  return json;
}

export async function downloadImageFromDrive(fileId) {
  if (!accessToken) throw new Error("Not logged in to Google Drive");

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Lỗi khi tải ảnh từ Drive");
  }

  const blob = await res.blob();
  return blob;
}
