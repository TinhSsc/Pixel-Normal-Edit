/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 13: Parallel & Intersecting Lines — Drawing parallel and intersecting lines.
 */
function lessonParallelAndIntersecting(canvasSize = 32, color = '#00bcd4') {
  const margin = Math.floor(canvasSize * 0.1);
  const mid = Math.floor(canvasSize / 2);
  const offset = 4;
  return [
    shapes.drawLine(margin, margin, canvasSize - margin, margin, color),
    shapes.drawLine(margin, margin + offset, canvasSize - margin, margin + offset, color),
    shapes.drawLine(margin, margin + offset * 2, canvasSize - margin, margin + offset * 2, color),
    shapes.drawLine(mid - offset*2, mid, mid + offset*2, canvasSize - margin, '#ff5722'),
    shapes.drawLine(mid + offset*2, mid, mid - offset*2, canvasSize - margin, '#ff5722')
  ];
}

module.exports = { lessonParallelAndIntersecting };
