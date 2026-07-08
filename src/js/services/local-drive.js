import { saveLocalDirectoryHandle, getLocalDirectoryHandle } from '../core/storage.js';

let currentDirectoryHandle = null;

export async function initLocalDrive() {
  currentDirectoryHandle = await getLocalDirectoryHandle();
  if (currentDirectoryHandle) {
    window.dispatchEvent(new CustomEvent('local-dir-changed', { detail: { name: currentDirectoryHandle.name } }));
  }
  return currentDirectoryHandle;
}

export function getCurrentDirectoryHandle() {
  return currentDirectoryHandle;
}

export async function pickLocalDirectory() {
  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error("Trình duyệt không hỗ trợ chọn thư mục (File System Access API).");
    }
    
    currentDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await saveLocalDirectoryHandle(currentDirectoryHandle);
    
    // Phát event để UI cập nhật
    window.dispatchEvent(new CustomEvent('local-dir-changed', { detail: { name: currentDirectoryHandle.name } }));
    
    return currentDirectoryHandle;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to pick directory:', err);
    }
    return null;
  }
}

export async function verifyPermission(handle) {
  if (!handle) return false;
  
  const options = { mode: 'readwrite' };
  
  // Kiểm tra quyền hiện tại
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  // Nếu chưa có, xin cấp lại quyền
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }
  
  return false;
}

export async function saveFileToLocalDrive(filename, blob) {
  if (!currentDirectoryHandle) {
    throw new Error("Chưa chọn thư mục làm việc.");
  }
  
  const hasPermission = await verifyPermission(currentDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Không có quyền ghi vào thư mục. Vui lòng cấp quyền lại.");
  }
  
  const fileHandle = await currentDirectoryHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  
  return true;
}

export async function clearLocalDirectory() {
  currentDirectoryHandle = null;
  await saveLocalDirectoryHandle(null);
  window.dispatchEvent(new CustomEvent('local-dir-changed', { detail: { name: null } }));
}

export async function listLocalFiles() {
  if (!currentDirectoryHandle) return [];
  
  const hasPermission = await verifyPermission(currentDirectoryHandle);
  if (!hasPermission) return [];

  const files = [];
  try {
    for await (const entry of currentDirectoryHandle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase();
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.json')) {
          const file = await entry.getFile();
          files.push({
            name: entry.name,
            lastModified: file.lastModified,
            handle: entry,
            isJson: name.endsWith('.json')
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to list local files:', err);
  }
  
  // Sort by lastModified descending
  files.sort((a, b) => b.lastModified - a.lastModified);
  return files;
}

export async function readLocalFile(fileHandle) {
  const hasPermission = await verifyPermission(fileHandle);
  if (!hasPermission) {
    throw new Error("Không có quyền đọc file. Vui lòng cấp quyền lại.");
  }
  
  const file = await fileHandle.getFile();
  // Return the actual File object which is a Blob
  return file;
}

