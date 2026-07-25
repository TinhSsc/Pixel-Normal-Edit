/**
 * Auto-extracted from transform_lessons_2.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Rotate (Rotation)
 * Analyzing how objects change when rotated around X, Y, Z axes.
 * We can reuse the Axis Orientation lesson as it perfectly demonstrates rotation.
 */
function lessonRotate(canvasSize = 32, color = '#ff5722') {
  // Reusing the axis orientation lesson which draws cylinders rotated along X, Y, Z
  return structureLessons.lessonAxisOrientation(canvasSize, color);
}

module.exports = { lessonRotate };
