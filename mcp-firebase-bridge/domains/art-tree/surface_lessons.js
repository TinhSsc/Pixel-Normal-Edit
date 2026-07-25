const shapes = require('./shapes');
const surfaceShapes = require('./surface_shapes');

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

/**
 * Lesson: Edge Types (Hard sharp corners vs Soft rounded edges)
 */
function lessonEdgeTypes(canvasSize = 32, color = '#ff5722') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.3);
  const qX2 = Math.floor(canvasSize * 0.7);
  const midY = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.25);

  // 1. Hard Edge (Sharp corners)
  commands.push(shapes.drawRectangle(qX1 - w/2, midY - w/2, w, w, '#e91e63', false));

  // 2. Soft Edge / Transitional
  // Draw a box with rounded corners (fillet)
  const r = Math.floor(w * 0.2); // Corner radius
  const rx = qX2 - w/2;
  const ry = midY - w/2;
  
  // Straight segments
  commands.push(shapes.drawLine(rx + r, ry, rx + w - r, ry, '#00bcd4')); // Top
  commands.push(shapes.drawLine(rx + w, ry + r, rx + w, ry + w - r, '#00bcd4')); // Right
  commands.push(shapes.drawLine(rx + r, ry + w, rx + w - r, ry + w, '#00bcd4')); // Bottom
  commands.push(shapes.drawLine(rx, ry + r, rx, ry + w - r, '#00bcd4')); // Left
  
  // Rounded corners (approximated with small circles for visual simplicity)
  commands.push(shapes.drawCircle(rx + r, ry + r, r, '#00bcd4', false)); // TL
  commands.push(shapes.drawCircle(rx + w - r, ry + r, r, '#00bcd4', false)); // TR
  commands.push(shapes.drawCircle(rx + w - r, ry + w - r, r, '#00bcd4', false)); // BR
  commands.push(shapes.drawCircle(rx + r, ry + w - r, r, '#00bcd4', false)); // BL

  return commands;
}

/**
 * Lesson: Cup Analysis (Analyzing surfaces of a cup)
 */
function lessonCupAnalysis(canvasSize = 32, color = '#607d8b') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);
  const h = Math.floor(canvasSize * 0.4);

  return surfaceShapes.drawCupAnalysis(cx, cy, r, h);
}

/**
 * Lesson: Chair Analysis (Analyzing surfaces and edges of a chair)
 */
function lessonChairAnalysis(canvasSize = 32, color = '#795548') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.3);

  return surfaceShapes.drawChairAnalysis(cx, cy, w);
}

function getSurfaceLessonCatalog() {
  return [
    { id: 'surface_types', name: 'Surface Types', description: 'Flat, Convex, Concave planes', fn: lessonSurfaceTypes },
    { id: 'edge_types', name: 'Edge Types', description: 'Hard vs Soft (Transitional) edges', fn: lessonEdgeTypes },
    { id: 'surface_cup', name: 'Cup Analysis', description: 'Real object: Convex/Concave walls, Rim, Tube handle', fn: lessonCupAnalysis },
    { id: 'surface_chair', name: 'Chair Analysis', description: 'Real object: Flat planes, Hard edges, Cylindrical legs', fn: lessonChairAnalysis },
  ];
}

module.exports = {
  lessonSurfaceTypes,
  lessonEdgeTypes,
  lessonCupAnalysis,
  lessonChairAnalysis,
  getSurfaceLessonCatalog
};
