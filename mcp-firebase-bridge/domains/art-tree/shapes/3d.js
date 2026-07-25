
/**
 * Draw a wireframe box (oblique projection)
 */
function drawWireframeBox(cx, cy, width, height, depth, color) {
  const commands = [];
  const dx = Math.floor(depth * 0.7);
  const dy = Math.floor(depth * 0.5);

  // Front face
  const fX = cx - Math.floor(width/2);
  const fY = cy - Math.floor(height/2);
  commands.push(shapes.drawRectangle(fX, fY, width, height, color, false));
  
  // Back face (shifted by dx, -dy)
  const bX = fX + dx;
  const bY = fY - dy;
  const backColor = '#9e9e9e'; // Lighter color for inner/back structure
  commands.push(shapes.drawRectangle(bX, bY, width, height, backColor, false));
  
  // Connect corners (edges)
  commands.push(shapes.drawLine(fX, fY, bX, bY, color)); // Top-left
  commands.push(shapes.drawLine(fX + width, fY, bX + width, bY, color)); // Top-right
  commands.push(shapes.drawLine(fX, fY + height, bX, bY + height, backColor)); // Bottom-left (hidden)
  commands.push(shapes.drawLine(fX + width, fY + height, bX + width, bY + height, color)); // Bottom-right
  
  return commands;
}

/**
 * Draw a sphere showing volume with cross contours
 */
function drawSphereVolume(cx, cy, r, color) {
  const commands = [];
  
  // Silhouette
  commands.push(shapes.drawCircle(cx, cy, r, color, false));
  
  // Horizontal cross contour (latitude)
  commands.push(shapes.drawEllipse(cx, cy, r, Math.floor(r * 0.3), '#03a9f4', false));
  
  // Vertical cross contour (longitude)
  commands.push(shapes.drawEllipse(cx, cy, Math.floor(r * 0.3), r, '#03a9f4', false));
  
  // Center
  commands.push(shapes.drawCircle(cx, cy, 1, '#ff0000', true));
  
  // Axis
  commands.push(advShapes.drawAxis(cx, cy - r - 5, cx, cy + r + 5));

  return commands;
}

/**
 * Draw a cylinder showing volume and perspective
 */
function drawCylinderVolume(cx, cy, r, h, color) {
  const commands = [];
  
  const topRy = Math.floor(r * 0.2); // Top ellipse is narrower
  const botRy = Math.floor(r * 0.3); // Bottom ellipse is wider (perspective)
  
  const topY = cy - Math.floor(h/2);
  const botY = cy + Math.floor(h/2);
  
  // Central axis
  commands.push(advShapes.drawAxis(cx, topY - 10, cx, botY + 10));
  
  // Back curve of bottom ellipse (lighter)
  // Our drawEllipse draws the whole thing, we'll just draw the whole ellipse
  commands.push(shapes.drawEllipse(cx, botY, r, botRy, color, false));
  
  // Vertical edges
  commands.push(shapes.drawLine(cx - r, topY, cx - r, botY, color));
  commands.push(shapes.drawLine(cx + r, topY, cx + r, botY, color));
  
  // Top ellipse
  commands.push(shapes.drawEllipse(cx, topY, r, topRy, color, false));

  return commands;
}

/**
 * Draw a cone showing volume
 */
function drawConeVolume(cx, cy, r, h, color) {
  const commands = [];
  const baseRy = Math.floor(r * 0.3);
  const apexY = cy - Math.floor(h/2);
  const baseY = cy + Math.floor(h/2);
  
  // Central axis
  commands.push(advShapes.drawAxis(cx, apexY - 10, cx, baseY + 10));
  
  // Base ellipse
  commands.push(shapes.drawEllipse(cx, baseY, r, baseRy, color, false));
  
  // Tangent edges (approximate to the edges of the ellipse rx)
  commands.push(shapes.drawLine(cx, apexY, cx - r, baseY, color));
  commands.push(shapes.drawLine(cx, apexY, cx + r, baseY, color));
  
  // Apex
  commands.push(shapes.drawCircle(cx, apexY, 2, '#ff0000', true));
  
  return commands;
}

module.exports = {
  drawWireframeBox,
  drawSphereVolume,
  drawCylinderVolume,
  drawConeVolume
};
