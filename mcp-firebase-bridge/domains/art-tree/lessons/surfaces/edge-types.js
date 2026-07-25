/**
 * Auto-extracted from surface_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Edge Types (Hard sharp corners vs Soft rounded edges)
 */
function lessonEdgeTypes(canvasSize = 32, color = '#ff5722') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.3);
  const qX2 = Math.floor(canvasSize * 0.7);
  const midY = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.25);

  // 1. Hard Edge (Sharp corners)
  commands.push(shapes.drawRectangle(qX1 - w/2, midY - w/2, w, w, '#e91e63', false));

  // 2. Soft Edge / Transitional
  // Draw a box with rounded corners (fillet)
  const r = Math.floor(w * 0.2); // Corner radius
  const rx = qX2 - w/2;
  const ry = midY - w/2;
  
  // Straight segments
  commands.push(shapes.drawLine(rx + r, ry, rx + w - r, ry, '#00bcd4')); // Top
  commands.push(shapes.drawLine(rx + w, ry + r, rx + w, ry + w - r, '#00bcd4')); // Right
  commands.push(shapes.drawLine(rx + r, ry + w, rx + w - r, ry + w, '#00bcd4')); // Bottom
  commands.push(shapes.drawLine(rx, ry + r, rx, ry + w - r, '#00bcd4')); // Left
  
  // Rounded corners (approximated with small circles for visual simplicity)
  commands.push(shapes.drawCircle(rx + r, ry + r, r, '#00bcd4', false)); // TL
  commands.push(shapes.drawCircle(rx + w - r, ry + r, r, '#00bcd4', false)); // TR
  commands.push(shapes.drawCircle(rx + w - r, ry + w - r, r, '#00bcd4', false)); // BR
  commands.push(shapes.drawCircle(rx + r, ry + w - r, r, '#00bcd4', false)); // BL

  return commands;
}

module.exports = { lessonEdgeTypes };
