/**
 * Canvas Settings Module
 * 
 * Manages checkerboard pattern customization for canvas background.
 * Provides getters/setters for checker color and size, with localStorage persistence.
 * 
 * @module canvas-settings
 */

const STORAGE_KEYS = {
  MODE: 'pixel-edit-canvas-mode',
  CHECKER_COLOR: 'pixel-edit-canvas-checker-color',
  CHECKER_SIZE: 'pixel-edit-canvas-checker-size'
};

const DEFAULT_SETTINGS = {
  mode: 'default', // 'default' | 'custom'
  checkerColor: '#3e3e4a',
  checkerSize: 2 // pixels (1-20)
};

/**
 * Get current canvas settings from localStorage or defaults
 * @returns {Object} Canvas settings object
 */
export function getCanvasSettings() {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.MODE) || DEFAULT_SETTINGS.mode;
    const checkerColor = localStorage.getItem(STORAGE_KEYS.CHECKER_COLOR) || DEFAULT_SETTINGS.checkerColor;
    const checkerSize = parseInt(localStorage.getItem(STORAGE_KEYS.CHECKER_SIZE), 10) || DEFAULT_SETTINGS.checkerSize;

    return {
      mode,
      checkerColor,
      checkerSize: Math.min(20, Math.max(1, checkerSize)) // Clamp between 1-20
    };
  } catch (e) {
    console.warn('Failed to read canvas settings from localStorage:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save canvas settings to localStorage
 * @param {Object} settings - Settings to save
 * @param {string} settings.mode - 'default' | 'custom'
 * @param {string} settings.checkerColor - Hex color string
 * @param {number} settings.checkerSize - Size in pixels (1-20)
 */
export function setCanvasSettings(settings) {
  try {
    if (settings.mode !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MODE, settings.mode);
    }
    if (settings.checkerColor !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CHECKER_COLOR, settings.checkerColor);
    }
    if (settings.checkerSize !== undefined) {
      const clampedSize = Math.min(20, Math.max(1, parseInt(settings.checkerSize, 10)));
      localStorage.setItem(STORAGE_KEYS.CHECKER_SIZE, clampedSize);
    }
  } catch (e) {
    console.warn('Failed to save canvas settings to localStorage:', e);
  }
}

/**
 * Apply canvas settings to CSS custom properties on document root
 * Call this after settings change to update the UI immediately
 */
export function applyCanvasSettings() {
  const settings = getCanvasSettings();
  const root = document.documentElement;

  if (settings.mode === 'custom') {
    root.style.setProperty('--custom-checker-color', settings.checkerColor);
    root.style.setProperty('--custom-checker-size', `${settings.checkerSize}px`);
  } else {
    root.style.removeProperty('--custom-checker-color');
    root.style.removeProperty('--custom-checker-size');
  }
}

/**
 * Reset canvas settings to defaults
 */
export function resetCanvasSettings() {
  try {
    localStorage.removeItem(STORAGE_KEYS.MODE);
    localStorage.removeItem(STORAGE_KEYS.CHECKER_COLOR);
    localStorage.removeItem(STORAGE_KEYS.CHECKER_SIZE);
  } catch (e) {
    console.warn('Failed to reset canvas settings:', e);
  }
  applyCanvasSettings();
}

/**
 * Initialize canvas settings on app load
 * Call this once during app initialization
 */
export function initCanvasSettings() {
  applyCanvasSettings();
}

// Export storage keys for reference
export { STORAGE_KEYS };