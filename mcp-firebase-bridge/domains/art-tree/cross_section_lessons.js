const csShapes = require('./cross_section_shapes');

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

/**
 * Lesson: Head Sections (Cranium, Face, Jaw)
 */
function lessonHeadSections(canvasSize = 32, color = '#ff9800') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const height = Math.floor(canvasSize * 0.8);

  return csShapes.drawHeadStructure(cx, cy, height, color);
}

function getCrossSectionLessonCatalog() {
  return [
    { id: 'cs_bottle', name: 'Bottle Cross-sections', description: 'Base, body, shoulder, neck, mouth', fn: lessonBottleSections },
    { id: 'cs_glass', name: 'Glass Cross-sections', description: 'Base, body, mouth', fn: lessonGlassSections },
    { id: 'cs_head', name: 'Head Cross-sections', description: 'Cranium, face, jaw', fn: lessonHeadSections },
  ];
}

module.exports = {
  lessonBottleSections,
  lessonGlassSections,
  lessonHeadSections,
  getCrossSectionLessonCatalog
};
