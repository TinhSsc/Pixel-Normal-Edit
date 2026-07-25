/**
 * Auto-extracted from cross_section_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Head Sections (Cranium, Face, Jaw)
 */
function lessonHeadSections(canvasSize = 32, color = '#ff9800') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const height = Math.floor(canvasSize * 0.8);

  return csShapes.drawHeadStructure(cx, cy, height, color);
}

module.exports = { lessonHeadSections };
