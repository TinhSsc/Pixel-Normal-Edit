/**
 * Auto-extracted from 3d_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Cylinder Properties (Central axis, Bases, Perspective change)
 */
function lessonCylinderProperties(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.3);
  const h = Math.floor(canvasSize * 0.6);

  // Draw cylinder volume
  commands.push(...shapes3d.drawCylinderVolume(cx, cy, r, h, color));
  
  // Highlight Height
  commands.push(...advShapes.drawDistance(cx + r + 4, cy - Math.floor(h/2), cx + r + 4, cy + Math.floor(h/2), '#4caf50'));

  // Highlight Radius (top base)
  commands.push(...advShapes.drawDistance(cx, cy - Math.floor(h/2), cx + r, cy - Math.floor(h/2), '#ff9800'));

  return commands;
}

module.exports = { lessonCylinderProperties };
