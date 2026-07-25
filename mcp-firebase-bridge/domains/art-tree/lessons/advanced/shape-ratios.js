/**
 * Auto-extracted from advanced_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Shape Ratios
 */
function lessonShapeRatios(canvasSize = 32, color = '#2196f3') {
  const margin = Math.floor(canvasSize * 0.1);
  const w1 = Math.floor(canvasSize * 0.2);
  const h1 = w1; // 1:1
  const w2 = Math.floor(canvasSize * 0.2);
  const h2 = Math.floor(canvasSize * 0.4); // 1:2
  
  return [
    shapes.drawRectangle(margin, margin, w1, h1, color, false),
    shapes.drawRectangle(canvasSize - margin - w2, margin, w2, h2, '#4caf50', false),
    ...advShapes.drawDistance(margin, margin + h1 + 2, margin + w1, margin + h1 + 2, '#888'),
    ...advShapes.drawDistance(canvasSize - margin - w2, margin + h2 + 2, canvasSize - margin, margin + h2 + 2, '#888')
  ];
}

module.exports = { lessonShapeRatios };
