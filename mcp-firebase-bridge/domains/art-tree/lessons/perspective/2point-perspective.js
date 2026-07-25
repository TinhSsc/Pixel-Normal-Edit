/**
 * Auto-extracted from perspective_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: 2-Point Perspective
 */
function lesson2PointPerspective(canvasSize = 32, color = '#4caf50') {
  const commands = [];
  const horizonY = Math.floor(canvasSize * 0.5);
  const vp1X = Math.floor(canvasSize * 0.1);
  const vp2X = Math.floor(canvasSize * 0.9);
  
  // Horizon & VPs
  commands.push(...perspShapes.drawHorizon(canvasSize, horizonY));
  commands.push(...perspShapes.drawVP(vp1X, horizonY));
  commands.push(...perspShapes.drawVP(vp2X, horizonY));

  // 2-Point Box straddling the horizon
  const startX = Math.floor(canvasSize * 0.4);
  const startY = Math.floor(canvasSize * 0.3);
  const h = Math.floor(canvasSize * 0.4);
  
  commands.push(...perspShapes.draw2PointBox(vp1X, horizonY, vp2X, horizonY, startX, startY, h, 0.3, 0.4, color));

  return commands;
}

module.exports = { lesson2PointPerspective };
