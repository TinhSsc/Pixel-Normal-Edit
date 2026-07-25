
/**
 * Draw a trapezoid (isosceles usually) centered horizontally.
 * @param {number} x - Top-left X of the bounding box
 * @param {number} y - Top Y
 * @param {number} topWidth - Width of the top edge
 * @param {number} bottomWidth - Width of the bottom edge
 * @param {number} height - Height of the trapezoid
 * @param {string} color - Hex color
 * @param {boolean} filled
 */
function drawTrapezoid(x, y, topWidth, bottomWidth, height, color, filled = false) {
  const midX = x + Math.max(topWidth, bottomWidth) / 2;
  const topX1 = Math.round(midX - topWidth / 2);
  const topX2 = Math.round(midX + topWidth / 2);
  const botX1 = Math.round(midX - bottomWidth / 2);
  const botX2 = Math.round(midX + bottomWidth / 2);

  const points = [
    { x: topX1, y },
    { x: topX2, y },
    { x: botX2, y: y + height },
    { x: botX1, y: y + height }
  ];
  return shapes.drawPolygon(points, color, filled);
}

/**
 * Draw a rhombus given center and its two diagonals (width, height).
 */
function drawRhombus(cx, cy, width, height, color, filled = false) {
  const points = [
    { x: cx, y: cy - Math.floor(height / 2) },
    { x: cx + Math.floor(width / 2), y: cy },
    { x: cx, y: cy + Math.floor(height / 2) },
    { x: cx - Math.floor(width / 2), y: cy }
  ];
  return shapes.drawPolygon(points, color, filled);
}

/**
 * Draw a symmetry axis line (using a distinct color, e.g., light grey/red).
 */
function drawAxis(x0, y0, x1, y1) {
  return shapes.drawLine(x0, y0, x1, y1, '#ffaaaa'); // Light red for axis
}

/**
 * Draw a dimension/distance line with end ticks.
 */
function drawDistance(x0, y0, x1, y1, color = '#888888') {
  const commands = [];
  commands.push(shapes.drawLine(x0, y0, x1, y1, color));
  
  // Draw small ticks at ends (perpendicular)
  const isHorizontal = Math.abs(x1 - x0) > Math.abs(y1 - y0);
  if (isHorizontal) {
    commands.push(shapes.drawLine(x0, y0 - 2, x0, y0 + 2, color));
    commands.push(shapes.drawLine(x1, y1 - 2, x1, y1 + 2, color));
  } else {
    commands.push(shapes.drawLine(x0 - 2, y0, x0 + 2, y0, color));
    commands.push(shapes.drawLine(x1 - 2, y1, x1 + 2, y1, color));
  }
  return commands;
}

module.exports = {
  drawTrapezoid,
  drawRhombus,
  drawAxis,
  drawDistance
};
