/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 9: Proportions and Angles — Practice maintaining proportions and angles.
 */
function lessonProportionsAndAngles(canvasSize = 32, color = '#3f51b5') {
  const mid = Math.floor(canvasSize / 2);
  const size1 = Math.floor(canvasSize * 0.4);
  const size2 = Math.floor(size1 / 2);
  return [
    shapes.drawSquare(mid - Math.floor(size1/2), mid - Math.floor(size1/2), size1, color, false),
    shapes.drawSquare(mid - Math.floor(size2/2), mid - Math.floor(size2/2), size2, '#e91e63', false),
    shapes.drawLine(mid, mid, mid + size1, mid - size1, '#009688')
  ];
}

module.exports = { lessonProportionsAndAngles };
