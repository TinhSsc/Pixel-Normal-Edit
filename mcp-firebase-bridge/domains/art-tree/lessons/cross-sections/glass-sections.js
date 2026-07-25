/**
 * Auto-extracted from cross_section_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Glass Sections (Base, Mid, Mouth)
 */
function lessonGlassSections(canvasSize = 32, color = '#9c27b0') {
  const cx = Math.floor(canvasSize / 2);
  const totalH = Math.floor(canvasSize * 0.6);
  const topY = Math.floor(canvasSize * 0.2);
  const bottomY = topY + totalH;

  const sections = [
    { y: topY, r: Math.floor(canvasSize * 0.3) },                         // Mouth (wide)
    { y: topY + Math.floor(totalH * 0.5), r: Math.floor(canvasSize * 0.2) },  // Mid body (widening)
    { y: bottomY, r: Math.floor(canvasSize * 0.15) }                      // Base (small)
  ];

  return csShapes.drawLoftedForm(cx, topY, bottomY, sections, color, true);
}

module.exports = { lessonGlassSections };
