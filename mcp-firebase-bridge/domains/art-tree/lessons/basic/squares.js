/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 2: Squares & Rectangles — Understanding right angles and proportions.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonSquares(canvasSize = 32, color = '#1565c0') {
  const margin = Math.floor(canvasSize * 0.1);
  const small = Math.floor(canvasSize * 0.2);
  const large = Math.floor(canvasSize * 0.35);
  return [
    // Small square (outline)
    shapes.drawSquare(margin, margin, small, color, false),
    // Large square (filled)
    shapes.drawSquare(canvasSize - margin - large, margin, large, '#ff7043', true),
    // Rectangle (horizontal)
    shapes.drawRectangle(margin, canvasSize - margin - small, large + small, small, '#4caf50', false),
    // Rectangle (vertical, filled)
    shapes.drawRectangle(canvasSize - margin - small, canvasSize - margin - large, small, large, '#9c27b0', true),
  ];
}

module.exports = { lessonSquares };
