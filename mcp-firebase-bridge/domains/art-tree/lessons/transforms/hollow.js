/**
 * Auto-extracted from transform_lessons_2.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Hollow (Carve interior)
 * Cylinder -> Pipe/Hole
 */
function lessonHollow(canvasSize = 32, color = '#3f51b5') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const outerR = Math.floor(canvasSize * 0.35);
  const innerR = Math.floor(canvasSize * 0.25);
  const h = Math.floor(canvasSize * 0.6);

  // Hollow cylinder
  commands.push(...transformShapes.drawHollowCylinder(cx, cy, outerR, innerR, h, color));

  return commands;
}

module.exports = { lessonHollow };
