/**
 * Auto-extracted from transform_lessons_2.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Combine (Merge forms)
 * Box + Cylinder (e.g., a wheel on an axle, or a tower on a base)
 */
function lessonCombine(canvasSize = 32, color = '#607d8b') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  
  // 1. Base Box
  const w = Math.floor(canvasSize * 0.5);
  const h = Math.floor(canvasSize * 0.2);
  const d = Math.floor(canvasSize * 0.3);
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);
  
  const fX = cx - Math.floor(w/2);
  const fY = cy + Math.floor(canvasSize * 0.2);
  
  // Front face
  commands.push(shapes.drawRectangle(fX, fY, w, h, color, false));
  // Top face (oblique)
  commands.push(shapes.drawLine(fX, fY, fX + dx, fY - dy, color));
  commands.push(shapes.drawLine(fX + w, fY, fX + w + dx, fY - dy, color));
  commands.push(shapes.drawLine(fX + dx, fY - dy, fX + w + dx, fY - dy, color));
  
  // 2. Intersecting Cylinder (Tower on top of box)
  const cylR = Math.floor(canvasSize * 0.15);
  const cylH = Math.floor(canvasSize * 0.4);
  const cylX = cx + Math.floor(dx/2);
  const cylY = fY - Math.floor(dy/2); // Center of the top face
  
  // Draw cylinder standing on the box
  const topY = cylY - cylH;
  // Top ellipse
  commands.push(shapes.drawEllipse(cylX, topY, cylR, Math.floor(cylR * 0.3), '#ff9800', false));
  // Base ellipse (intersecting the box top face)
  commands.push(shapes.drawEllipse(cylX, cylY, cylR, Math.floor(cylR * 0.3), '#ff9800', false));
  // Vertical edges
  commands.push(shapes.drawLine(cylX - cylR, topY, cylX - cylR, cylY, '#ff9800'));
  commands.push(shapes.drawLine(cylX + cylR, topY, cylX + cylR, cylY, '#ff9800'));

  return commands;
}

module.exports = { lessonCombine };
