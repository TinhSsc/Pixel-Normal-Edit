const skyShapes1 = require('./sky_shapes_1');

/**
 * Lesson 1: Sun Shapes (Hình dạng mặt trời)
 * Compares Basic, Soft, and Rays
 */
function lessonSunShapes(canvasSize = 32) {
  const commands = [];
  const y = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);

  // Left: Basic
  commands.push(...skyShapes1.drawSunBasic(Math.floor(canvasSize * 0.2), y, r));
  // Center: Soft
  commands.push(...skyShapes1.drawSunSoft(Math.floor(canvasSize * 0.5), y, r));
  // Right: Rays
  commands.push(...skyShapes1.drawSunRays(Math.floor(canvasSize * 0.8), y, r));

  return commands;
}

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

function getSkyLesson1Catalog() {
  return [
    { id: 'sky_sun_shapes', name: 'Sun Shapes', description: 'Basic vs Soft vs Rays', fn: lessonSunShapes },
    { id: 'sky_sunset_colors', name: 'Sunset Colors', description: 'Gradient bands from Blue to Yellow', fn: lessonSunsetColors },
    { id: 'sky_sunset_sky', name: 'Sunset Sky', description: 'Combining gradient sky with a soft sun', fn: lessonSunsetSky },
  ];
}

module.exports = {
  lessonSunShapes,
  lessonSunsetColors,
  lessonSunsetSky,
  getSkyLesson1Catalog
};
