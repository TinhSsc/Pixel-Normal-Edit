/**
 * Auto-extracted from sky_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 2: Sunset Colors (Màu sắc buổi chiều)
 * Shows the progression of colors from blue to yellow
 */
function lessonSunsetColors(canvasSize = 32) {
  const commands = [];
  
  // The classic sunset gradient: Blue -> Purple -> Pink -> Orange -> Yellow (top to bottom)
  const sunsetPalette = [
    '#3f51b5', // Blue
    '#9c27b0', // Purple
    '#e91e63', // Pink
    '#ff9800', // Orange
    '#ffeb3b'  // Yellow
  ];

  commands.push(...skyShapes1.drawSkyGradient(0, 0, canvasSize, canvasSize, sunsetPalette));

  return commands;
}

module.exports = { lessonSunsetColors };
