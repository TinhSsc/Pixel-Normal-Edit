/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 4: Ellipses — Understanding oval shapes and proportions.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonEllipses(canvasSize = 32, color = '#9c27b0') {
  const mid = Math.floor(canvasSize / 2);
  const rx = Math.floor(canvasSize * 0.3);
  const ry = Math.floor(canvasSize * 0.15);
  return [
    // Horizontal ellipse (outline)
    shapes.drawEllipse(mid, mid, rx, ry, color, false),
    // Vertical ellipse (filled)
    shapes.drawEllipse(mid, mid, ry, rx, '#4caf50', true),
    // Small circle-like ellipse
    shapes.drawEllipse(mid + rx, mid - ry, Math.floor(rx / 3), Math.floor(ry / 2), '#ff5722', true),
  ];
}

module.exports = { lessonEllipses };
