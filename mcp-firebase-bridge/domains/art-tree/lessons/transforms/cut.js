/**
 * Auto-extracted from transform_lessons_2.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Cut (Slice a form)
 * Sphere -> Truncated Sphere (exposing internal cross-section)
 */
function lessonCut(canvasSize = 32, color = '#8bc34a') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);

  // Original sphere (ghost)
  commands.push(shapes.drawCircle(cx, cy, r, '#bdbdbd', false));
  
  // Cut sphere
  commands.push(...transformShapes.drawTruncatedSphere(cx, cy, r, color));

  return commands;
}

module.exports = { lessonCut };
