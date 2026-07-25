/**
 * Auto-extracted from ellipse_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Ellipse Proportions (Wide vs Narrow)
 */
function lessonEllipseProportions(canvasSize = 32, color = '#ff9800') {
  const commands = [];
  const midY = Math.floor(canvasSize / 2);
  const qX = Math.floor(canvasSize / 4);
  const rx = Math.floor(canvasSize * 0.2);

  // Wide Ellipse (Closer to a circle)
  commands.push(shapes.drawEllipse(qX, midY, rx, Math.floor(rx * 0.8), color, false));
  
  // Medium Ellipse
  commands.push(shapes.drawEllipse(qX * 2, midY, rx, Math.floor(rx * 0.4), '#9c27b0', false));
  
  // Narrow Ellipse (Almost a line)
  commands.push(shapes.drawEllipse(qX * 3, midY, rx, Math.floor(rx * 0.1), '#f44336', false));

  return commands;
}

module.exports = { lessonEllipseProportions };
