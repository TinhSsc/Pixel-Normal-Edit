/**
 * Auto-extracted from cross_section_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Bottle Sections (Base, Body, Shoulder, Neck, Mouth)
 */
function lessonBottleSections(canvasSize = 32, color = '#2196f3') {
  const cx = Math.floor(canvasSize / 2);
  const totalH = Math.floor(canvasSize * 0.8);
  const topY = Math.floor(canvasSize * 0.1);
  const bottomY = topY + totalH;

  const sections = [
    { y: topY, r: Math.floor(canvasSize * 0.08) },                        // Mouth (slightly open)
    { y: topY + Math.floor(totalH * 0.1), r: Math.floor(canvasSize * 0.06) }, // Neck (narrow)
    { y: topY + Math.floor(totalH * 0.3), r: Math.floor(canvasSize * 0.2) },  // Shoulder (shrinking to body)
    { y: topY + Math.floor(totalH * 0.6), r: Math.floor(canvasSize * 0.25) }, // Body (wide)
    { y: bottomY, r: Math.floor(canvasSize * 0.25) }                      // Base (wide)
  ];

  return csShapes.drawLoftedForm(cx, topY, bottomY, sections, color, true);
}

module.exports = { lessonBottleSections };
