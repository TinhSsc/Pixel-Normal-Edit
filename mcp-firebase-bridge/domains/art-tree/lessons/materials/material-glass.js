/**
 * Auto-extracted from material_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Transparent (Glass)
 * Demonstrates Fresnel effect, sharp reflections, and light transmission.
 */
function lessonMaterialGlass(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);

  commands.push(...materialShapes.drawGlassSphere(cx, cy, r));

  return commands;
}

module.exports = { lessonMaterialGlass };
