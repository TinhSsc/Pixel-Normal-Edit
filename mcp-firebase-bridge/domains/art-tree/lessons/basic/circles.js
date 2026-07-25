/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 3: Circles — Learning curves and symmetry.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonCircles(canvasSize = 32, color = '#e91e63') {
  const mid = Math.floor(canvasSize / 2);
  const r1 = Math.floor(canvasSize * 0.15);
  const r2 = Math.floor(canvasSize * 0.3);
  return [
    // Small circle (outline)
    shapes.drawCircle(mid, mid, r1, color, false),
    // Large circle (filled)
    shapes.drawCircle(mid, mid, r2, '#2196f3', true),
    // Small filled circle offset
    shapes.drawCircle(mid + r1, mid - r1, Math.floor(r1 / 2), '#ff9800', true),
  ];
}

module.exports = { lessonCircles };
