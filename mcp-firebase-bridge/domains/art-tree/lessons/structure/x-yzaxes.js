/**
 * Auto-extracted from structure_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: XYZ Axes (Vertical, Horizontal, Depth)
 */
function lessonXYZAxes(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const length = Math.floor(canvasSize * 0.4);

  // Draw the axes
  commands.push(...structureShapes.drawXYZAxes(cx, cy, length));
  
  // Draw a simple box aligned with these axes to show how objects follow them
  const w = Math.floor(length * 0.5);
  const h = Math.floor(length * 0.5);
  const d = Math.floor(length * 0.5);
  // Using a lighter color for the reference box
  commands.push(...shapes3d.drawWireframeBox(cx + Math.floor(w/2), cy - Math.floor(h/2), w, h, d, '#e0e0e0'));

  return commands;
}

module.exports = { lessonXYZAxes };
