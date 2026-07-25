/**
 * Auto-extracted from ellipse_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Ellipse Orientations (Horizontal, Vertical, Tilted)
 */
function lessonEllipseOrientations(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const midY = Math.floor(canvasSize / 2);
  const qX = Math.floor(canvasSize / 4);
  const rLong = Math.floor(canvasSize * 0.2);
  const rShort = Math.floor(canvasSize * 0.1);

  // Horizontal (Left)
  commands.push(shapes.drawEllipse(qX, midY, rLong, rShort, color, false));
  
  // Vertical (Middle)
  commands.push(shapes.drawEllipse(qX * 2, midY, rShort, rLong, '#e91e63', false));
  
  // Tilted (Right) - 45 degrees
  commands.push(...ellipseShapes.drawRotatedEllipse(qX * 3, midY, rLong, rShort, Math.PI / 4, '#4caf50'));

  return commands;
}

module.exports = { lessonEllipseOrientations };
