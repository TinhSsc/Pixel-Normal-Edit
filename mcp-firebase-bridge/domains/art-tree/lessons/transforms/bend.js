/**
 * Auto-extracted from transform_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Bend (Curved bending)
 * Cylinder -> Bent Tube
 */
function lessonBend(canvasSize = 32, color = '#e91e63') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.1);
  const length = Math.floor(canvasSize * 0.35);

  // Original straight tube (ghost, pointing right)
  commands.push(shapes.drawLine(cx, cy - r, cx + length * 2, cy - r, '#bdbdbd'));
  commands.push(shapes.drawLine(cx, cy + r, cx + length * 2, cy + r, '#bdbdbd'));
  
  // Bent tube
  commands.push(...transformShapes.drawBentTube(cx, cy + length, r, length, color));

  return commands;
}

module.exports = { lessonBend };
