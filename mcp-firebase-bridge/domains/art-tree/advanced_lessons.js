const shapes = require('./shapes');
const advShapes = require('./advanced_shapes');

/**
 * Lesson: Shape Ratios
 */
function lessonShapeRatios(canvasSize = 32, color = '#2196f3') {
  const margin = Math.floor(canvasSize * 0.1);
  const w1 = Math.floor(canvasSize * 0.2);
  const h1 = w1; // 1:1
  const w2 = Math.floor(canvasSize * 0.2);
  const h2 = Math.floor(canvasSize * 0.4); // 1:2
  
  return [
    shapes.drawRectangle(margin, margin, w1, h1, color, false),
    shapes.drawRectangle(canvasSize - margin - w2, margin, w2, h2, '#4caf50', false),
    ...advShapes.drawDistance(margin, margin + h1 + 2, margin + w1, margin + h1 + 2, '#888'),
    ...advShapes.drawDistance(canvasSize - margin - w2, margin + h2 + 2, canvasSize - margin, margin + h2 + 2, '#888')
  ];
}

/**
 * Lesson: Symmetry & Axes
 */
function lessonSymmetryAndAxis(canvasSize = 32, color = '#9c27b0') {
  const mid = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.5);
  const h = Math.floor(canvasSize * 0.5);
  const commands = [];
  
  // Draw Rhombus
  commands.push(advShapes.drawRhombus(mid, mid, w, h, color, false));
  // Vertical axis
  commands.push(advShapes.drawAxis(mid, Math.floor(canvasSize * 0.1), mid, canvasSize - Math.floor(canvasSize * 0.1)));
  // Horizontal axis
  commands.push(advShapes.drawAxis(Math.floor(canvasSize * 0.1), mid, canvasSize - Math.floor(canvasSize * 0.1), mid));
  
  return commands;
}

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

/**
 * Lesson: Distances
 */
function lessonDistances(canvasSize = 32, color = '#00bcd4') {
  const margin = Math.floor(canvasSize * 0.2);
  const commands = [];
  
  // Points
  commands.push(shapes.drawCircle(margin, margin, 1, color, true));
  commands.push(shapes.drawCircle(canvasSize - margin, margin, 1, color, true));
  commands.push(shapes.drawCircle(margin, canvasSize - margin, 1, color, true));
  
  // Distances between them
  commands.push(...advShapes.drawDistance(margin, margin, canvasSize - margin, margin));
  commands.push(...advShapes.drawDistance(margin, margin, margin, canvasSize - margin));
  
  return commands;
}

/**
 * Lesson: Shape Relationships
 */
function lessonShapeRelationships(canvasSize = 32, color = '#607d8b') {
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);
  const commands = [];
  
  // Overlapping circles
  commands.push(shapes.drawCircle(mid - Math.floor(r/2), mid, r, color, false));
  commands.push(shapes.drawCircle(mid + Math.floor(r/2), mid, r, '#e91e63', false));
  
  // Nested squares (top left)
  const margin = Math.floor(canvasSize * 0.1);
  const size = Math.floor(canvasSize * 0.25);
  commands.push(shapes.drawSquare(margin, margin, size, '#4caf50', false));
  commands.push(shapes.drawSquare(margin + 2, margin + 2, size - 4, '#8bc34a', false));
  
  return commands;
}

/**
 * Get catalog of advanced lessons
 */
function getAdvancedLessonCatalog() {
  return [
    { id: 'adv_ratios', name: 'Shape Ratios', description: 'Width-to-height ratios of shapes', fn: lessonShapeRatios },
    { id: 'adv_symmetry', name: 'Symmetry & Axes', description: 'Symmetry and central axes', fn: lessonSymmetryAndAxis },
    { id: 'adv_angles', name: 'Angles', description: 'Acute, right, and obtuse angles', fn: lessonAngles },
    { id: 'adv_distances', name: 'Distances', description: 'Distances between points', fn: lessonDistances },
    { id: 'adv_relationships', name: 'Shape Relationships', description: 'Overlap and nesting of shapes', fn: lessonShapeRelationships },
  ];
}

module.exports = {
  lessonShapeRatios,
  lessonSymmetryAndAxis,
  lessonAngles,
  lessonDistances,
  lessonShapeRelationships,
  getAdvancedLessonCatalog
};