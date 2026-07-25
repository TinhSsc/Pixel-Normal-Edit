/**
 * Auto-extracted from 3d_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Cone Properties (Apex, Base, Axis)
 */
function lessonConeProperties(canvasSize = 32, color = '#ff5722') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);
  const h = Math.floor(canvasSize * 0.6);

  // Draw cone volume
  commands.push(...shapes3d.drawConeVolume(cx, cy, r, h, color));
  
  // Highlight Height
  const apexY = cy - Math.floor(h/2);
  const baseY = cy + Math.floor(h/2);
  commands.push(...advShapes.drawDistance(cx + r + 4, apexY, cx + r + 4, baseY, '#4caf50'));
  
  // Highlight Radius (base)
  commands.push(...advShapes.drawDistance(cx, baseY, cx + r, baseY, '#ff9800'));

  return commands;
}

module.exports = { lessonConeProperties };
