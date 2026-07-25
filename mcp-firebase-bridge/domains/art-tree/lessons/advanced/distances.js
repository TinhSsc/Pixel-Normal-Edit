/**
 * Auto-extracted from advanced_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Distances
 */
function lessonDistances(canvasSize = 32, color = '#00bcd4') {
  const margin = Math.floor(canvasSize * 0.2);
  const commands = [];
  
  // Points
  commands.push(shapes.drawCircle(margin, margin, 1, color, true));
  commands.push(shapes.drawCircle(canvasSize - margin, margin, 1, color, true));
  commands.push(shapes.drawCircle(margin, canvasSize - margin, 1, color, true));
  
  // Distances between them
  commands.push(...advShapes.drawDistance(margin, margin, canvasSize - margin, margin));
  commands.push(...advShapes.drawDistance(margin, margin, margin, canvasSize - margin));
  
  return commands;
}

module.exports = { lessonDistances };
