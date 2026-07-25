const shapes = require('./shapes');
const ellipseShapes = require('./ellipse_shapes');

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

function getEllipseLessonCatalog() {
  return [
    { id: 'ellipse_orientations', name: 'Ellipse Orientations', description: 'Horizontal, Vertical, and Tilted ellipses', fn: lessonEllipseOrientations },
    { id: 'ellipse_proportions', name: 'Ellipse Proportions', description: 'Wide vs Narrow ellipses', fn: lessonEllipseProportions },
    { id: 'ellipse_anatomy', name: 'Ellipse Anatomy', description: 'Symmetry, Major/Minor axes, and Center', fn: lessonEllipseAnatomy },
    { id: 'ellipse_coaxial', name: 'Coaxial Ellipses', description: 'Multiple ellipses sharing the same axis', fn: lessonCoaxialEllipses },
  ];
}

module.exports = {
  lessonEllipseOrientations,
  lessonEllipseProportions,
  lessonEllipseAnatomy,
  lessonCoaxialEllipses,
  getEllipseLessonCatalog
};
