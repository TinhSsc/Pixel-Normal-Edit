/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 8: Freehand — Practice freehand drawing with simulated hand tremor.
 */
function lessonFreehand(canvasSize = 32, color = '#795548') {
  const margin = Math.floor(canvasSize * 0.1);
  const points = [];
  let y = Math.floor(canvasSize / 2);
  for (let x = margin; x < canvasSize - margin; x += 2) {
    points.push({ x, y: y + Math.floor(Math.random() * 3) - 1 });
  }
  return shapes.drawPolyline(points, color);
}

module.exports = { lessonFreehand };
