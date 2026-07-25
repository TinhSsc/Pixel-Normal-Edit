/**
 * Auto-extracted from material_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Shiny vs Matte (Metal vs Plastic/Rubber)
 * Compares high contrast sharp highlights vs low contrast diffused highlights.
 */
function lessonMaterialShiny(canvasSize = 32) {
  const commands = [];
  const cx1 = Math.floor(canvasSize * 0.3);
  const cx2 = Math.floor(canvasSize * 0.7);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);

  // 1. Metal Sphere (Left)
  commands.push(...materialShapes.drawMetalSphere(cx1, cy, r));

  // 2. Matte/Plastic Sphere (Right)
  commands.push(...materialShapes.drawMatteSphere(cx2, cy, r, '#e65100'));

  return commands;
}

module.exports = { lessonMaterialShiny };
