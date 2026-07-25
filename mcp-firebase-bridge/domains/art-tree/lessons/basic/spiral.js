/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 11: Spiral — Drawing spiral curves.
 */
function lessonSpiral(canvasSize = 32, color = '#ff9800') {
  const mid = Math.floor(canvasSize / 2);
  const points = [];
  const maxRadius = Math.floor(canvasSize * 0.4);
  const loops = 3;
  for (let angle = 0; angle < Math.PI * 2 * loops; angle += 0.3) {
    const r = (angle / (Math.PI * 2 * loops)) * maxRadius;
    points.push({ x: Math.round(mid + r * Math.cos(angle)), y: Math.round(mid + r * Math.sin(angle)) });
  }
  return shapes.drawPolyline(points, color);
}

module.exports = { lessonSpiral };
