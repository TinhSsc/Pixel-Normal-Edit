/**
 * Auto-extracted from light_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: 6 Zones of Light (Sphere)
 * Highlight, Light, Halftone, Core shadow, Reflected light, Cast shadow.
 */
function lessonLightZones(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.25);
  
  // Light from top-left (approx -45 degrees or -135 degrees mathematically)
  const lightAngle = -Math.PI * 0.75; 

  // Draw light source
  const lx = cx + Math.floor(r * 2 * Math.cos(lightAngle));
  const ly = cy + Math.floor(r * 2 * Math.sin(lightAngle));
  commands.push(...lightShapes.drawLightSource(lx, ly, Math.floor(canvasSize * 0.05)));

  // Draw shaded sphere
  commands.push(...lightShapes.drawShadedSphere(cx, cy, r, lightAngle));

  return commands;
}

module.exports = { lessonLightZones };
