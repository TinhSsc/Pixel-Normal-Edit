/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 10: Curves — C-curves and S-curves.
 */
function lessonCurves(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);
  // C curve
  const cPoints = [];
  for (let i = -Math.PI/2; i <= Math.PI/2; i += 0.2) {
    cPoints.push({ x: Math.round(mid - r - r * Math.cos(i)), y: Math.round(mid / 2 + r * Math.sin(i)) });
  }
  commands.push(...shapes.drawPolyline(cPoints, color));
  // S curve
  const sPoints = [];
  for (let i = -Math.PI/2; i <= Math.PI*1.5; i += 0.2) {
    const isTop = i < Math.PI/2;
    const cy = isTop ? (mid + Math.floor(canvasSize*0.1)) : (mid + Math.floor(canvasSize*0.1) + r*2);
    const signX = isTop ? -1 : 1;
    sPoints.push({ x: Math.round(mid + r + signX * r * Math.cos(i)), y: Math.round(cy + r * Math.sin(i)) });
  }
  commands.push(...shapes.drawPolyline(sPoints, '#e91e63'));
  return commands;
}

module.exports = { lessonCurves };
