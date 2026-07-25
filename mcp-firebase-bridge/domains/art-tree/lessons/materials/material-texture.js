/**
 * Auto-extracted from material_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Texture (Wood vs Stone)
 * Compares organic lines vs rough cracks.
 */
function lessonMaterialTexture(canvasSize = 32) {
  const commands = [];
  const cx1 = Math.floor(canvasSize * 0.3);
  const cx2 = Math.floor(canvasSize * 0.7);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);

  // 1. Wood Sphere (Left)
  commands.push(...materialShapes.drawTexturedSphere(cx1, cy, r, 'wood'));

  // 2. Stone Sphere (Right)
  commands.push(...materialShapes.drawTexturedSphere(cx2, cy, r, 'stone'));

  return commands;
}

module.exports = { lessonMaterialTexture };
