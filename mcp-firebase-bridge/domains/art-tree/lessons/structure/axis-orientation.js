/**
 * Auto-extracted from structure_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Axis Orientation (Object pointing along different axes)
 */
function lessonAxisOrientation(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const r = Math.floor(canvasSize * 0.1);
  const h = Math.floor(canvasSize * 0.25);
  const midY = Math.floor(canvasSize / 2);

  // 1. Standing Cylinder (Oriented along Y axis)
  const q1 = Math.floor(canvasSize * 0.2);
  // Draw vertical axis
  commands.push(shapes.drawLine(q1, midY - h + 5, q1, midY + 5, '#4caf50'));
  commands.push(shapes.drawEllipse(q1, midY, r, Math.floor(r * 0.3), color, false)); // Base
  commands.push(shapes.drawEllipse(q1, midY - h, r, Math.floor(r * 0.3), color, false)); // Top
  commands.push(shapes.drawLine(q1 - r, midY, q1 - r, midY - h, color));
  commands.push(shapes.drawLine(q1 + r, midY, q1 + r, midY - h, color));

  // 2. Lying Cylinder (Oriented along X axis)
  const q2 = Math.floor(canvasSize * 0.5);
  // Draw horizontal axis
  commands.push(shapes.drawLine(q2 - 5, midY + h - r, q2 + h + 5, midY + h - r, '#f44336'));
  commands.push(shapes.drawEllipse(q2, midY + h - r, Math.floor(r * 0.3), r, color, false)); // Left base
  commands.push(shapes.drawEllipse(q2 + h, midY + h - r, Math.floor(r * 0.3), r, color, false)); // Right base
  commands.push(shapes.drawLine(q2, midY + h - r - r, q2 + h, midY + h - r - r, color));
  commands.push(shapes.drawLine(q2, midY + h - r + r, q2 + h, midY + h - r + r, color));

  // 3. Tilted/Depth Cylinder (Oriented along an arbitrary angle / Z axis)
  const q3 = Math.floor(canvasSize * 0.75);
  const angle = Math.PI / 6; // 30 degrees tilt
  // Draw tilted axis
  const dx = Math.floor(h * Math.cos(angle));
  const dy = Math.floor(h * Math.sin(angle));
  commands.push(shapes.drawLine(q3 - dx/2 - 5, midY - dy/2 - 5, q3 + dx/2 + 5, midY + dy/2 + 5, '#2196f3'));
  // Draw rotated ellipses for bases
  commands.push(...ellipseShapes.drawRotatedEllipse(q3 - dx/2, midY - dy/2, Math.floor(r * 0.3), r, angle, color));
  commands.push(...ellipseShapes.drawRotatedEllipse(q3 + dx/2, midY + dy/2, Math.floor(r * 0.3), r, angle, color));
  // Tangent lines for tilted cylinder (approximate)
  const tx = Math.floor(r * Math.sin(angle));
  const ty = Math.floor(r * Math.cos(angle));
  commands.push(shapes.drawLine(q3 - dx/2 - tx, midY - dy/2 + ty, q3 + dx/2 - tx, midY + dy/2 + ty, color));
  commands.push(shapes.drawLine(q3 - dx/2 + tx, midY - dy/2 - ty, q3 + dx/2 + tx, midY + dy/2 - ty, color));

  return commands;
}

module.exports = { lessonAxisOrientation };
