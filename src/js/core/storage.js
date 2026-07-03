const DB_NAME = 'PixelArtEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'workspaceStore';

import { parseColorToUint32 } from './color-utils.js';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(event.target.error);

    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function set(key, value) {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function get(key) {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveWorkspace(tabs, activeTabId) {
  try {
    const serializedTabs = tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      pixelMap: tab.pixelMap,
      groupMap: Array.from(tab.groupMap.entries()),
      history: tab.history,
      grid: { w: tab.grid.w, h: tab.grid.h },
      bg: tab.bg,
      driveFileId: tab.driveFileId,
      autoBackupDrive: tab.autoBackupDrive
    }));

    await set('workspace', {
      tabs: serializedTabs,
      activeTabId
    });
  } catch (err) {
    console.error('Failed to save workspace to IndexedDB:', err);
  }
}

export async function loadWorkspace() {
  try {
    const data = await get('workspace');
    if (!data || !data.tabs) return null;

    // Deserialize tabs
    const deserializedTabs = data.tabs.map(tab => {
      let migratedPixelMap = tab.pixelMap;
      if (Array.isArray(tab.pixelMap)) {
        // Migrate legacy format
        migratedPixelMap = new Uint32Array(tab.grid.w * tab.grid.h);
        tab.pixelMap.forEach(([key, color]) => {
          const x = key >> 16;
          const y = key & 0xFFFF;
          migratedPixelMap[y * tab.grid.w + x] = parseColorToUint32(color);
        });
      }

      return {
        id: tab.id,
        name: tab.name,
        pixelMap: migratedPixelMap,
        groupMap: new Map(tab.groupMap),
        history: tab.history,
        grid: { w: tab.grid.w, h: tab.grid.h, imgData: null, data32: null }, // Reconstructed later
        bg: tab.bg,
        driveFileId: tab.driveFileId || null,
        autoBackupDrive: tab.autoBackupDrive || false
      };
    });

    return {
      tabs: deserializedTabs,
      activeTabId: data.activeTabId
    };
  } catch (err) {
    console.error('Failed to load workspace from IndexedDB:', err);
    return null;
  }
}
