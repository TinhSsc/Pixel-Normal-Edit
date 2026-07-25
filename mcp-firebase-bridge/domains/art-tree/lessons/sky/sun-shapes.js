/**
 * Auto-extracted from sky_lessons_1.js
 */
const shapes = require('../../shapes');

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

module.exports = { lessonSunShapes };
