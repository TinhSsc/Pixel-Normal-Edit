/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 12: Strokes — Long strokes, short strokes, thick and thin lines.
 */
function lessonStrokes(canvasSize = 32, color = '#2196f3') {
  const margin = Math.floor(canvasSize * 0.1);
  const y1 = Math.floor(canvasSize * 0.3);
  const y2 = Math.floor(canvasSize * 0.5);
  const y3 = Math.floor(canvasSize * 0.7);
  return [
    shapes.drawLine(margin, y1, canvasSize - margin, y1, color),
    shapes.drawLine(margin, y2, Math.floor(canvasSize / 2), y2, '#4caf50'),
    shapes.drawLine(margin, y3, canvasSize - margin, y3, '#f44336'),
    shapes.drawLine(margin, y3 + 1, canvasSize - margin, y3 + 1, '#f44336'),
    shapes.drawLine(margin, y3 + 2, canvasSize - margin, y3 + 2, '#f44336'),
  ];
}

module.exports = { lessonStrokes };
