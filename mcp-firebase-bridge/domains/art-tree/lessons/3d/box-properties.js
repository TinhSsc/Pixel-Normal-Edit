/**
 * Auto-extracted from 3d_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Box Properties (Width, Height, Depth, Planes, Edges)
 */
function lessonBoxProperties(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.4);
  const h = Math.floor(canvasSize * 0.4);
  const d = Math.floor(canvasSize * 0.3);

  // Draw wireframe box
  commands.push(...shapes3d.drawWireframeBox(cx, cy, w, h, d, color));
  
  // Highlight dimensions
  const fX = cx - Math.floor(w/2);
  const fY = cy - Math.floor(h/2);
  
  // Width
  commands.push(...advShapes.drawDistance(fX, fY + h + 2, fX + w, fY + h + 2, '#4caf50'));
  // Height
  commands.push(...advShapes.drawDistance(fX - 2, fY, fX - 2, fY + h, '#ff9800'));
  
  // Depth (approximate along the oblique edge)
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);
  commands.push(...advShapes.drawDistance(fX + w + 2, fY + h, fX + w + 2 + dx, fY + h - dy, '#e91e63'));

  return commands;
}

module.exports = { lessonBoxProperties };
