/**
 * Auto-extracted from ellipse_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Coaxial Ellipses (Multiple ellipses on the same axis)
 */
function lessonCoaxialEllipses(canvasSize = 32, color = '#795548') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const rx = Math.floor(canvasSize * 0.3);
  
  // Central axis line
  commands.push(shapes.drawLine(cx, Math.floor(canvasSize * 0.1), cx, canvasSize - Math.floor(canvasSize * 0.1), '#bdbdbd'));
  
  // Top ellipse (narrower, viewed from steeper angle)
  commands.push(shapes.drawEllipse(cx, Math.floor(canvasSize * 0.2), rx, Math.floor(rx * 0.2), color, false));
  
  // Middle ellipse
  commands.push(shapes.drawEllipse(cx, Math.floor(canvasSize * 0.5), rx, Math.floor(rx * 0.3), color, false));
  
  // Bottom ellipse (wider, viewed from less steep angle)
  commands.push(shapes.drawEllipse(cx, canvasSize - Math.floor(canvasSize * 0.2), rx, Math.floor(rx * 0.4), color, false));

  return commands;
}

module.exports = { lessonCoaxialEllipses };
