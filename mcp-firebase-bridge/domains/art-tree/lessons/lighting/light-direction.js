/**
 * Auto-extracted from light_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Light Direction & Intensity (Light direction and plane values)
 * Shows a box with planes facing/turning away from light.
 */
function lessonLightDirection(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.25);
  const h = Math.floor(canvasSize * 0.25);

  // Light from top-left
  const lightAngle = -Math.PI * 0.8; 
  
  const lx = cx - Math.floor(canvasSize * 0.35);
  const ly = cy - Math.floor(canvasSize * 0.35);
  commands.push(...lightShapes.drawLightSource(lx, ly, Math.floor(canvasSize * 0.05)));

  // Draw shaded box
  commands.push(...lightShapes.drawShadedBox(cx, cy, w, h, lightAngle));

  return commands;
}

module.exports = { lessonLightDirection };
