/**
 * Auto-extracted from advanced_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Shape Relationships
 */
function lessonShapeRelationships(canvasSize = 32, color = '#607d8b') {
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);
  const commands = [];
  
  // Overlapping circles
  commands.push(shapes.drawCircle(mid - Math.floor(r/2), mid, r, color, false));
  commands.push(shapes.drawCircle(mid + Math.floor(r/2), mid, r, '#e91e63', false));
  
  // Nested squares (top left)
  const margin = Math.floor(canvasSize * 0.1);
  const size = Math.floor(canvasSize * 0.25);
  commands.push(shapes.drawSquare(margin, margin, size, '#4caf50', false));
  commands.push(shapes.drawSquare(margin + 2, margin + 2, size - 4, '#8bc34a', false));
  
  return commands;
}

module.exports = { lessonShapeRelationships };
