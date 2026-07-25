/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 5: Triangles — Three-point shapes and stability.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonTriangles(canvasSize = 32, color = '#ff5722') {
  const mid = Math.floor(canvasSize / 2);
  const size = Math.floor(canvasSize * 0.4);
  const margin = Math.floor(canvasSize * 0.1);
  return [
    // Equilateral triangle (outline)
    shapes.drawEquilateralTriangle(mid, mid, size, color, false),
    // Right triangle (filled)
    shapes.drawTriangle([
      { x: margin, y: canvasSize - margin },
      { x: margin, y: margin },
      { x: Math.floor(canvasSize * 0.35), y: canvasSize - margin },
    ], '#3f51b5', true),
    // Inverted triangle
    shapes.drawEquilateralTriangle(mid, mid, Math.floor(size * 0.6), '#009688', true),
  ];
}

module.exports = { lessonTriangles };
