const shapes = require('./shapes');
const ellipseShapes = require('./ellipse_shapes');

function drawEgg(cx, cy, r, color) {
  const commands = [];
  // Approximating an egg by drawing two halves (top stretched, bottom semi-circle)
  // We'll use multiple ellipses overlapping, or a polygon approximation
  // Let's use a simpler polygon approximation for the egg contour
  const points = [];
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * 2 * Math.PI;
    const px = r * Math.cos(t);
    // Stretch the top half
    const stretch = Math.sin(t) < 0 ? 1.5 : 1.0; 
    const py = r * Math.sin(t) * stretch;
    points.push({ x: Math.round(cx + px), y: Math.round(cy + py) });
  }
  commands.push(shapes.drawPolyline(points, color));
  
  // Add cross contour to show 3D volume
  commands.push(shapes.drawEllipse(cx, cy + Math.floor(r * 0.2), r, Math.floor(r * 0.3), '#03a9f4', false));
  return commands;
}

function drawBentTube(cx, cy, r, length, color) {
  const commands = [];
  // Draw a curved tube using a semicircular path
  const pathR = length; // radius of the bend path
  // We place ellipses along the arc
  for (let i = 0; i <= 6; i++) {
    const angle = (i / 6) * Math.PI; // 0 to 180 degrees
    const ex = Math.round(cx + pathR * Math.cos(angle));
    const ey = Math.round(cy - pathR * Math.sin(angle));
    // Rotate the ellipse to be perpendicular to the path
    commands.push(...ellipseShapes.drawRotatedEllipse(ex, ey, Math.floor(r * 0.3), r, angle, color));
  }
  // Connect inner and outer edges (approximate arcs)
  const innerPts = [], outerPts = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    innerPts.push({ x: Math.round(cx + (pathR - r) * Math.cos(a)), y: Math.round(cy - (pathR - r) * Math.sin(a)) });
    outerPts.push({ x: Math.round(cx + (pathR + r) * Math.cos(a)), y: Math.round(cy - (pathR + r) * Math.sin(a)) });
  }
  commands.push(shapes.drawPolyline(innerPts, color));
  commands.push(shapes.drawPolyline(outerPts, color));
  
  return commands;
}

function drawTruncatedSphere(cx, cy, r, color) {
  const commands = [];
  // Sphere outline (partial)
  const points = [];
  const cutAngle = Math.PI / 4; // Top section cut off
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * 2 * Math.PI;
    // Skip the top part
    if (t > Math.PI + cutAngle && t < 2 * Math.PI - cutAngle) continue;
    points.push({ x: Math.round(cx + r * Math.cos(t)), y: Math.round(cy + r * Math.sin(t)) });
  }
  commands.push(shapes.drawPolyline(points, color));
  
  // Cut surface (ellipse)
  const cutY = Math.round(cy + r * Math.sin(Math.PI + cutAngle));
  const cutRx = Math.round(r * Math.cos(cutAngle));
  const cutRy = Math.floor(cutRx * 0.3);
  commands.push(shapes.drawEllipse(cx, cutY, cutRx, cutRy, '#ff5722', false)); // Highlight cut surface
  
  // Cross contour to reinforce sphere shape
  commands.push(shapes.drawEllipse(cx, cy + Math.floor(r*0.2), r, Math.floor(r*0.3), '#03a9f4', false));
  
  return commands;
}

function drawHollowCylinder(cx, cy, outerR, innerR, h, color) {
  const commands = [];
  const topY = cy - Math.floor(h/2);
  const botY = cy + Math.floor(h/2);
  
  // Outer bottom
  commands.push(shapes.drawEllipse(cx, botY, outerR, Math.floor(outerR * 0.3), color, false));
  
  // Outer top
  commands.push(shapes.drawEllipse(cx, topY, outerR, Math.floor(outerR * 0.3), color, false));
  // Inner top (the hole)
  commands.push(shapes.drawEllipse(cx, topY, innerR, Math.floor(innerR * 0.3), '#e91e63', false));
  
  // Inner bottom (visible through hole - rough approximation)
  // We just draw the back curve of the inner bottom ellipse
  // For simplicity, we draw the full ellipse but lighter
  commands.push(shapes.drawEllipse(cx, botY, innerR, Math.floor(innerR * 0.3), '#bdbdbd', false));
  
  // Vertical edges
  commands.push(shapes.drawLine(cx - outerR, topY, cx - outerR, botY, color));
  commands.push(shapes.drawLine(cx + outerR, topY, cx + outerR, botY, color));
  
  // Inner edges (depth)
  commands.push(shapes.drawLine(cx - innerR, topY, cx - innerR, botY, '#9e9e9e'));
  commands.push(shapes.drawLine(cx + innerR, topY, cx + innerR, botY, '#9e9e9e'));

  return commands;
}

module.exports = {
  drawEgg,
  drawBentTube,
  drawTruncatedSphere,
  drawHollowCylinder
};
