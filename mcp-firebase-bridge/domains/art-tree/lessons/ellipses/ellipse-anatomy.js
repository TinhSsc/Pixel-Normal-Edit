/**
 * Auto-extracted from ellipse_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Ellipse Anatomy (Symmetry, Major/Minor axes, Center)
 */
function lessonEllipseAnatomy(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const rx = Math.floor(canvasSize * 0.35);
  const ry = Math.floor(canvasSize * 0.2);
  const angle = Math.PI / 6; // 30 degrees tilt to show axes clearly

  // Draw ellipse
  commands.push(...ellipseShapes.drawRotatedEllipse(cx, cy, rx, ry, angle, color));
  
  // Draw anatomy (axes and center)
  commands.push(...ellipseShapes.drawEllipseAxes(cx, cy, rx, ry, angle));

  return commands;
}

module.exports = { lessonEllipseAnatomy };
