/**
 * Auto-extracted from light_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Contact Shadow (Point of contact shadow)
 * The darkest area where an object touches the ground.
 */
function lessonContactShadow(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.3);

  // Ground line
  commands.push(shapes.drawLine(0, cy + r, canvasSize, cy + r, '#9e9e9e'));

  // Sphere outline
  commands.push(shapes.drawCircle(cx, cy, r, '#bdbdbd', false));

  // Cast shadow (faint)
  commands.push(shapes.drawEllipse(cx + Math.floor(r*0.5), cy + r, Math.floor(r*1.2), Math.floor(r*0.2), '#757575', true));

  // CONTACT SHADOW (Pitch black, right at the touching point)
  // Draw a very small, very dark ellipse directly under the center
  commands.push(shapes.drawEllipse(cx, cy + r, Math.floor(r * 0.4), 2, '#000000', true));
  commands.push(shapes.drawEllipse(cx, cy + r, Math.floor(r * 0.2), 1, '#000000', true));

  return commands;
}

module.exports = { lessonContactShadow };
