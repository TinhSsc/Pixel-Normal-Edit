/**
 * Auto-extracted from transform_lessons_1.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Squash (Compress)
 * Sphere -> Disk, Box -> Plate
 */
function lessonSquash(canvasSize = 32, color = '#ff9800') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.25);
  const qX2 = Math.floor(canvasSize * 0.75);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);

  // 1. Squash: Sphere -> Disk
  commands.push(shapes.drawCircle(qX1, cy, r, '#bdbdbd', false)); // Original
  // Squashed into a flat ellipse/disk
  commands.push(shapes.drawEllipse(qX1, cy, r * 1.2, Math.floor(r * 0.3), color, false)); 

  // 2. Squash: Box -> Plate
  const w = Math.floor(canvasSize * 0.2);
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w/2, w, w, '#bdbdbd', false)); // Original
  // Squashed into plate
  commands.push(shapes.drawRectangle(qX2 - w, cy - Math.floor(w*0.2), w * 2, Math.floor(w*0.4), '#4caf50', false));

  return commands;
}

module.exports = { lessonSquash };
