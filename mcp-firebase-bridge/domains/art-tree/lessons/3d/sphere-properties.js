/**
 * Auto-extracted from 3d_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Sphere Properties (Center, Radius, Cross contours, Axis)
 */
function lessonSphereProperties(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);

  // Draw sphere with volume lines
  commands.push(...shapes3d.drawSphereVolume(cx, cy, r, color));
  
  // Highlight radius
  commands.push(...advShapes.drawDistance(cx, cy, cx + r, cy, '#ff9800'));

  return commands;
}

module.exports = { lessonSphereProperties };
