/**
 * Auto-extracted from surface_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Cup Analysis (Analyzing surfaces of a cup)
 */
function lessonCupAnalysis(canvasSize = 32, color = '#607d8b') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);
  const h = Math.floor(canvasSize * 0.4);

  return surfaceShapes.drawCupAnalysis(cx, cy, r, h);
}

module.exports = { lessonCupAnalysis };
