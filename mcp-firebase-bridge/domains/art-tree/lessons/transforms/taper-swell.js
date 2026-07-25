/**
 * Auto-extracted from transform_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Taper & Swell (Narrow or bulge)
 * Cylinder -> Bottle
 */
function lessonTaperSwell(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const totalH = Math.floor(canvasSize * 0.8);
  const topY = Math.floor(canvasSize * 0.1);
  const bottomY = topY + totalH;
  const r = Math.floor(canvasSize * 0.25);

  // Original Cylinder (ghost)
  commands.push(shapes.drawLine(cx - r, topY, cx - r, bottomY, '#bdbdbd'));
  commands.push(shapes.drawLine(cx + r, topY, cx + r, bottomY, '#bdbdbd'));

  // Tapered and Swelled form (Bottle)
  const sections = [
    { y: topY, r: Math.floor(r * 0.3) },         // Neck (Tapered)
    { y: topY + Math.floor(totalH * 0.4), r: r },// Body (Swelled back to original radius)
    { y: bottomY, r: Math.floor(r * 0.8) }       // Base (Slightly tapered)
  ];
  commands.push(...csShapes.drawLoftedForm(cx, topY, bottomY, sections, color, true));

  return commands;
}

module.exports = { lessonTaperSwell };
