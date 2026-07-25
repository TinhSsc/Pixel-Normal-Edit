/**
 * Auto-extracted from advanced_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Symmetry & Axes
 */
function lessonSymmetryAndAxis(canvasSize = 32, color = '#9c27b0') {
  const mid = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.5);
  const h = Math.floor(canvasSize * 0.5);
  const commands = [];
  
  // Draw Rhombus
  commands.push(advShapes.drawRhombus(mid, mid, w, h, color, false));
  // Vertical axis
  commands.push(advShapes.drawAxis(mid, Math.floor(canvasSize * 0.1), mid, canvasSize - Math.floor(canvasSize * 0.1)));
  // Horizontal axis
  commands.push(advShapes.drawAxis(Math.floor(canvasSize * 0.1), mid, canvasSize - Math.floor(canvasSize * 0.1), mid));
  
  return commands;
}

module.exports = { lessonSymmetryAndAxis };
