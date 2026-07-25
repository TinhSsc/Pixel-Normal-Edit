/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 7: Composition — Combining basic shapes to create simple objects.
 * @param {number} canvasSize - Canvas dimension
 * @returns {Array<Object>} Array of command payloads
 */
function lessonComposition(canvasSize = 32) {
  const mid = Math.floor(canvasSize / 2);
  const q1 = Math.floor(canvasSize * 0.25);
  const q3 = Math.floor(canvasSize * 0.75);
  const small = Math.floor(canvasSize * 0.1);
  return [
    // House: square body
    shapes.drawSquare(q1, mid, q3 - q1, '#8d6e63', true),
    // House: triangle roof
    shapes.drawTriangle([
      { x: q1 - 1, y: mid },
      { x: mid, y: q1 },
      { x: q3 + 1, y: mid },
    ], '#d32f2f', true),
    // Sun: circle
    shapes.drawCircle(canvasSize - small - 2, small + 2, small, '#ffc107', true),
    // Tree: rectangle trunk
    shapes.drawRectangle(q1 + small, canvasSize - small - 2, Math.floor(small / 2), small, '#5d4037', true),
    // Tree: circle top
    shapes.drawCircle(q1 + Math.floor(small / 4), canvasSize - small - 4, Math.floor(small / 2), '#388e3c', true),
  ];
}

module.exports = { lessonComposition };
