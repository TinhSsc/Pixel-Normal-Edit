import { getActiveTabId, getTabs, updateTabMetadata } from './tab-manager.js';

const GLOBAL_PINS_KEY = 'pixel-global-pinned-colors';
const RECENT_COLORS_KEY = 'pixel-recent-used-colors';

let extractTimeout = null;

export function getGlobalPinnedColors() {
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_PINS_KEY)) || [];
  } catch {
    return [];
  }
}

export function setGlobalPinnedColors(colors) {
  localStorage.setItem(GLOBAL_PINS_KEY, JSON.stringify(colors));
}



export function getRecentColors() {
  const activeTabId = getActiveTabId();
  if (!activeTabId) return [];
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.meta && tab.meta.recentColors) {
    return tab.meta.recentColors;
  }
  return [];
}

export function addRecentColor(hex) {
  if (!hex) return;
  // Normalize hex
  hex = hex.toLowerCase();
  let colors = getRecentColors();
  colors = colors.filter(c => c !== hex);
  colors.unshift(hex);
  if (colors.length > 20) colors = colors.slice(0, 20);
  
  const activeTabId = getActiveTabId();
  if (activeTabId) {
    updateTabMetadata(activeTabId, { recentColors: colors });
    extractCanvasColors();
  }
}

export function extractCanvasColors() {
  const autoColors = getRecentColors();
  
  window.dispatchEvent(new CustomEvent('palette-updated', {
    detail: { autoColors }
  }));
}

let lastPrimaryColor = '#000000';
let lastSecondaryColor = '#ffffff';

// Add event listener to automatically track used colors
if (typeof document !== 'undefined') {
  document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'color' && e.target.classList.contains('color-input')) {
      const newColor = e.target.value.toLowerCase();
      if (e.target.classList.contains('primary-color')) {
        if (lastPrimaryColor && lastPrimaryColor !== newColor) {
          addRecentColor(lastPrimaryColor);
        }
        lastPrimaryColor = newColor;
      } else if (e.target.classList.contains('secondary-color')) {
        if (lastSecondaryColor && lastSecondaryColor !== newColor) {
          addRecentColor(lastSecondaryColor);
        }
        lastSecondaryColor = newColor;
      }
    }
  });
}

export function debounceExtractCanvasColors() {
  if (extractTimeout) clearTimeout(extractTimeout);
  extractTimeout = setTimeout(() => {
    extractCanvasColors();
  }, 200); // Debounce to avoid blocking the main thread during fast drawing
}

export function toggleColorPin(hex) {
  let globals = getGlobalPinnedColors();

  if (globals.includes(hex)) {
    // Global -> Auto (unpin completely)
    globals = globals.filter(c => c !== hex);
    setGlobalPinnedColors(globals);
  } else {
    // Auto -> Global
    globals.push(hex);
    setGlobalPinnedColors(globals);
  }

  // Trigger update
  extractCanvasColors();
}
