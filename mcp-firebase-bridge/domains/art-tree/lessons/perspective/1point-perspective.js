/**
 * Auto-extracted from perspective_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: 1-Point Perspective
 */
function lesson1PointPerspective(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const horizonY = Math.floor(canvasSize * 0.4);
  const vpX = Math.floor(canvasSize * 0.5);
  const vpY = horizonY;

  // Horizon & VP
  commands.push(...perspShapes.drawHorizon(canvasSize, horizonY));
  commands.push(...perspShapes.drawVP(vpX, vpY));

  // Box below horizon (seeing top face)
  const w = Math.floor(canvasSize * 0.2);
  const h = Math.floor(canvasSize * 0.15);
  commands.push(...perspShapes.draw1PointBox(vpX, vpY, Math.floor(canvasSize * 0.2), horizonY + Math.floor(canvasSize * 0.2), w, h, 0.4, color));
  
  // Box above horizon (seeing bottom face)
  commands.push(...perspShapes.draw1PointBox(vpX, vpY, Math.floor(canvasSize * 0.6), horizonY - Math.floor(canvasSize * 0.3), w, h, 0.4, '#e91e63'));

  return commands;
}

module.exports = { lesson1PointPerspective };
