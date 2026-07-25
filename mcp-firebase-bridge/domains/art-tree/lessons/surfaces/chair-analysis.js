/**
 * Auto-extracted from surface_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Chair Analysis (Analyzing surfaces and edges of a chair)
 */
function lessonChairAnalysis(canvasSize = 32, color = '#795548') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.3);

  return surfaceShapes.drawChairAnalysis(cx, cy, w);
}

module.exports = { lessonChairAnalysis };
