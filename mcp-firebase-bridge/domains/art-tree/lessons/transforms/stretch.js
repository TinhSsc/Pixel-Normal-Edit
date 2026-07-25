/**
 * Auto-extracted from transform_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Stretch (Elongate)
 * Sphere -> Egg, Box -> Bar
 */
function lessonStretch(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.25);
  const qX2 = Math.floor(canvasSize * 0.75);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);

  // 1. Stretch: Sphere -> Egg
  commands.push(shapes.drawCircle(qX1, cy, r, '#bdbdbd', false)); // Original sphere (ghost)
  commands.push(...transformShapes.drawEgg(qX1, cy, r, color)); // Stretched into egg

  // 2. Stretch: Box -> Bar (Tall)
  const w = Math.floor(canvasSize * 0.15);
  // Original box (ghost)
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w/2, w, w, '#bdbdbd', false));
  // Stretched bar
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w * 1.5, w, w * 3, '#9c27b0', false));

  return commands;
}

module.exports = { lessonStretch };
