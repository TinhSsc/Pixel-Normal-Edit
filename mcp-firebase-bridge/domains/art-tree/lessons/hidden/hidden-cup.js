/**
 * Auto-extracted from hidden_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Hidden Cup (Cup and inner bottom)
 * You don't see the full inside bottom, but must understand how the wall goes down.
 */
function lessonHiddenCup(canvasSize = 32, visibleColor = '#4caf50', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.25);
  const h = Math.floor(canvasSize * 0.5);

  return hiddenShapes.drawXRayCup(cx, cy, r, h, visibleColor, hiddenColor);
}

module.exports = { lessonHiddenCup };
