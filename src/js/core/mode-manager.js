import { isGradientModeActive, setGradientModeActive, isMirrorModeActive, setMirrorModeActive } from '../shared/pixel-writer.js';
import { isShowGrid, setShowGrid } from './render.js';
import { isAnimationMode, setAnimationMode, toggleAnimationMode, showOnionSkin, setOnionSkin, toggleOnionSkin } from './animation-state.js';

/**
 * ModeManager serves as a Facade for accessing and mutating 
 * all togglable modes in the canvas/workspace.
 */
export const ModeManager = {
  // Gradient Mode
  getGradient: isGradientModeActive,
  setGradient: setGradientModeActive,

  // Mirror Mode
  getMirror: isMirrorModeActive,
  setMirror: setMirrorModeActive,

  // Show Grid Mode
  getGrid: isShowGrid,
  setGrid: setShowGrid,

  // Animation Mode
  getAnimation: () => isAnimationMode,
  setAnimation: setAnimationMode,
  toggleAnimation: toggleAnimationMode,

  // Onion Skin Mode
  getOnionSkin: () => showOnionSkin,
  setOnionSkin: setOnionSkin,
  toggleOnionSkin: toggleOnionSkin
};
