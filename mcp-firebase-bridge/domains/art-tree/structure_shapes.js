const shapes = require('./shapes');
const ellipseShapes = require('./ellipse_shapes');

/**
 * Draw a 3D coordinate system (X, Y, Z axes) originating from a center point
 */
function drawXYZAxes(cx, cy, length) {
  const commands = [];
  
  // Y-axis (Vertical) - Green
  commands.push(shapes.drawLine(cx, cy, cx, cy - length, '#4caf50'));
  
  // X-axis (Horizontal) - Red
  commands.push(shapes.drawLine(cx, cy, cx + length, cy, '#f44336'));
  
  // Z-axis (Depth - Oblique projection) - Blue
  const dx = Math.floor(length * 0.7 * Math.cos(Math.PI / 6));
  const dy = Math.floor(length * 0.7 * Math.sin(Math.PI / 6));
  commands.push(shapes.drawLine(cx, cy, cx - dx, cy + dy, '#2196f3'));

  // Center point
  commands.push(shapes.drawCircle(cx, cy, 2, '#000000', true));

  return commands;
}

/**
 * Draw a complex bottle structure using cross-sections and central axis
 */
function drawBottleAnatomy(cx, cy, totalHeight, color) {
  const commands = [];
  
  const bottomY = cy + Math.floor(totalHeight / 2);
  const topY = cy - Math.floor(totalHeight / 2);
  
  // Central vertical axis
  commands.push(shapes.drawLine(cx, topY - 10, cx, bottomY + 10, '#bdbdbd'));
  
  // Define cross sections (y position from bottom, radius)
  const sections = [
    { y: bottomY, r: Math.floor(totalHeight * 0.2) },                     // Base
    { y: bottomY - Math.floor(totalHeight * 0.4), r: Math.floor(totalHeight * 0.2) },   // Body
    { y: bottomY - Math.floor(totalHeight * 0.7), r: Math.floor(totalHeight * 0.08) },  // Neck start
    { y: topY, r: Math.floor(totalHeight * 0.08) }                        // Mouth
  ];
  
  // Draw cross section ellipses
  for (const sec of sections) {
    // ry is based on perspective (lower = wider perspective, but keep it simple here)
    const ry = Math.floor(sec.r * 0.3);
    commands.push(shapes.drawEllipse(cx, sec.y, sec.r, ry, color, false));
    
    // Cross point on the axis
    commands.push(shapes.drawCircle(cx, sec.y, 1, '#ff0000', true));
  }
  
  // Draw outer contour lines
  for (let i = 0; i < sections.length - 1; i++) {
    const s1 = sections[i];
    const s2 = sections[i+1];
    
    // Left contour
    commands.push(shapes.drawLine(cx - s1.r, s1.y, cx - s2.r, s2.y, color));
    // Right contour
    commands.push(shapes.drawLine(cx + s1.r, s1.y, cx + s2.r, s2.y, color));
  }
  
  return commands;
}

module.exports = {
  drawXYZAxes,
  drawBottleAnatomy
};
