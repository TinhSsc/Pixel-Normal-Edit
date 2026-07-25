/**
 * Auto-extracted from hidden_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Hidden Head (Human head and skull)
 * You don't see the whole skull, but must understand the structure behind it.
 */
function lessonHiddenHead(canvasSize = 32, visibleColor = '#ff5722', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize * 0.4);
  const r = Math.floor(canvasSize * 0.25);

  return hiddenShapes.drawXRayHead(cx, cy, r, visibleColor, hiddenColor);
}

module.exports = { lessonHiddenHead };
