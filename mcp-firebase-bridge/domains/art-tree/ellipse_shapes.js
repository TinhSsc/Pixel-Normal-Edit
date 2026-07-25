const shapes = require('./shapes');

/**
 * Draw a rotated ellipse using a polygon approximation
 * @param {number} cx Center X
 * @param {number} cy Center Y
 * @param {number} rx X radius (major axis if rx > ry)
 * @param {number} ry Y radius
 * @param {number} angle Rotation angle in radians
 * @param {string} color Hex color
 * @param {number} segments Number of polygon segments
 */
function drawRotatedEllipse(cx, cy, rx, ry, angle, color, segments = 36) {
  const points = [];
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const px = rx * Math.cos(t);
    const py = ry * Math.sin(t);
    
    const x = Math.round(cx + px * cosA - py * sinA);
    const y = Math.round(cy + px * sinA + py * cosA);
    points.push({ x, y });
  }
  
  return shapes.drawPolyline(points, color);
}

/**
 * Draw major and minor axes for an ellipse
 */
function drawEllipseAxes(cx, cy, rx, ry, angle = 0) {
  const commands = [];
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  
  // Major/Minor Axis calculation based on rotation
  const x1 = Math.round(cx - rx * cosA);
  const y1 = Math.round(cy - rx * sinA);
  const x2 = Math.round(cx + rx * cosA);
  const y2 = Math.round(cy + rx * sinA);
  
  const y3_x = Math.round(cx + ry * sinA);
  const y3_y = Math.round(cy - ry * cosA);
  const y4_x = Math.round(cx - ry * sinA);
  const y4_y = Math.round(cy + ry * cosA);

  // Red for Major, Blue for Minor
  commands.push(shapes.drawLine(x1, y1, x2, y2, '#ff0000'));
  commands.push(shapes.drawLine(y3_x, y3_y, y4_x, y4_y, '#2196f3'));
  
  // Center dot
  commands.push(shapes.drawCircle(cx, cy, 1, '#000000', true));
  
  return commands;
}

module.exports = {
  drawRotatedEllipse,
  drawEllipseAxes
};
