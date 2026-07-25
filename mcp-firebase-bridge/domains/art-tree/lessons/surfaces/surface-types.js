/**
 * Auto-extracted from surface_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Surface Types (Flat, convex, concave)
 */
function lessonSurfaceTypes(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const midY = Math.floor(canvasSize / 2);
  const qX = Math.floor(canvasSize / 4);
  const r = Math.floor(canvasSize * 0.15);

  // 1. Flat Plane
  const w = Math.floor(canvasSize * 0.2);
  commands.push(shapes.drawRectangle(qX - w/2, midY - w/2, w, w, '#4caf50', false));
  // Add some grid lines to show it's flat
  commands.push(shapes.drawLine(qX, midY - w/2, qX, midY + w/2, '#4caf50'));
  commands.push(shapes.drawLine(qX - w/2, midY, qX + w/2, midY, '#4caf50'));

  // 2. Convex Surface (e.g. Dome/Sphere)
  // We use an ellipse that curves outwards (downwards)
  commands.push(shapes.drawEllipse(qX * 2, midY, r, r, '#ff9800', false));
  // Cross contour curving DOWN (convex towards viewer)
  commands.push(shapes.drawEllipse(qX * 2, midY + Math.floor(r*0.2), r, Math.floor(r*0.3), '#ff9800', false));

  // 3. Concave Surface (e.g. Bowl)
  // Draw the top rim of a bowl
  commands.push(shapes.drawEllipse(qX * 3, midY, r, Math.floor(r*0.3), '#9c27b0', false));
  // Draw the bottom curve (the inside of the bowl)
  const bowlPoints = [];
  for(let i=0; i<=18; i++) {
    const a = (i/18) * Math.PI; // 0 to 180 degrees (bottom half)
    bowlPoints.push({ x: Math.round(qX * 3 + r * Math.cos(a)), y: Math.round(midY + r * Math.sin(a)) });
  }
  commands.push(shapes.drawPolyline(bowlPoints, '#9c27b0'));

  return commands;
}

module.exports = { lessonSurfaceTypes };
