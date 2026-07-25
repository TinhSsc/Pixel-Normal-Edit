/**
 * Auto-extracted from advanced_lessons.js
 */
const shapes = require('../../shapes');
const advShapes = require('../../shapes/advanced');

/**
 * Lesson: Angles
 */
function lessonAngles(canvasSize = 32, color = '#ff5722') {
  const mid = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.6);
  const h = Math.floor(canvasSize * 0.3);
  const margin = Math.floor(canvasSize * 0.2);
  
  const commands = [];
  // Trapezoid (shows acute and obtuse angles)
  commands.push(advShapes.drawTrapezoid(margin, margin, Math.floor(w/2), w, h, color, false));
  
  // Right Triangle (shows 90 degree angle)
  commands.push(shapes.drawTriangle([
    { x: margin, y: canvasSize - margin },
    { x: margin, y: mid + margin },
    { x: margin + w, y: canvasSize - margin }
  ], '#3f51b5', false));
  
  return commands;
}

module.exports = { lessonAngles };
