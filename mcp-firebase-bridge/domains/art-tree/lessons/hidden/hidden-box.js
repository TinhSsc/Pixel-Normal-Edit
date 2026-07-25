/**
 * Auto-extracted from hidden_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Hidden Box (6-sided box)
 * You see 3 faces, but you must understand all 6.
 */
function lessonHiddenBox(canvasSize = 32, visibleColor = '#2196f3', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.4);
  const h = Math.floor(canvasSize * 0.4);
  const d = Math.floor(canvasSize * 0.4);

  return hiddenShapes.drawXRayBox(cx, cy, w, h, d, visibleColor, hiddenColor);
}

module.exports = { lessonHiddenBox };
