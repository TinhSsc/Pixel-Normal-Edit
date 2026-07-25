/**
 * Auto-extracted from structure_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Complex Structure Analysis (e.g. A Bottle)
 */
function lessonComplexStructure(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const totalHeight = Math.floor(canvasSize * 0.8);

  // Draw bottle structure showing cross-sections and central axis
  commands.push(...structureShapes.drawBottleAnatomy(cx, cy, totalHeight, color));

  return commands;
}

module.exports = { lessonComplexStructure };
