import { resizeCanvas, fitToScreen, getZoom, getPan, applyTransform } from './viewport.js';
import { renderPixels, setForceFullRender } from './render.js';
import { setupCanvasEvents } from '../canvas-events.js';
import { setupZoomActions } from '../actions/zoom.js';
import { initFloatingNav } from '../ui/floating-nav.js';

/**
 * Initializes the main canvas layout and dimensions.
 * Usually called once when the editor boots up.
 */
export function initMainCanvasLayout() {
  resizeCanvas();
  fitToScreen();
  renderPixels();
}

/**
 * Binds all interaction events for the main canvas.
 * Usually called after the canvas DOM is mounted.
 */
export function bindMainCanvasEvents() {
  setupCanvasEvents();
  setupZoomActions();
  initFloatingNav();
}

// Facade exports for common canvas operations
export {
  renderPixels,
  setForceFullRender,
  resizeCanvas,
  fitToScreen,
  getZoom,
  getPan,
  applyTransform
};
