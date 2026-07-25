/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 6: Polygons — Multi-sided shapes.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonPolygons(canvasSize = 32, color = '#607d8b') {
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);
  return [
    // Pentagon
    shapes.drawRegularPolygon(mid, mid, 5, r, '#4caf50', false),
    // Hexagon (filled)
    shapes.drawRegularPolygon(mid, mid, 6, Math.floor(r * 0.7), '#ff9800', true),
    // Octagon
    shapes.drawRegularPolygon(mid, mid, 8, Math.floor(r * 0.5), '#9c27b0', false),
  ];
}

module.exports = { lessonPolygons };
