/**
 * Auto-extracted from sky_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson 3: Sunset Sky (Bầu trời hoàng hôn)
 * Combines the gradient sky with a soft sun setting at the bottom
 */
function lessonSunsetSky(canvasSize = 32) {
  const commands = [];
  
  // 1. Draw the Sky
  const sunsetPalette = [
    '#1a237e', // Dark Blue
    '#512da8', // Deep Purple
    '#c2185b', // Magenta
    '#ff5722', // Deep Orange
    '#ffb300'  // Amber
  ];
  commands.push(...skyShapes1.drawSkyGradient(0, 0, canvasSize, canvasSize, sunsetPalette));

  // 2. Draw the Sun (Soft glowing sun near the bottom)
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize * 0.8);
  const r = Math.floor(canvasSize * 0.15);
  commands.push(...skyShapes1.drawSunSoft(cx, cy, r));

  return commands;
}

module.exports = { lessonSunsetSky };
