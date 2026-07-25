#!/usr/bin/env node
/**
 * lessons.js — Art Tree: Basic Shapes Lessons
 *
 * Layer: Lesson API (built on top of Shape API)
 *
 * Provides structured lessons that guide learners through
 * drawing basic geometric shapes step by step.
 * Each lesson returns a sequence of command payloads.
 */
const shapes = require('./shapes');

/**
 * Lesson 1: Lines — Introduction to drawing straight lines.
 * Teaches horizontal, vertical, and diagonal lines.
 * @param {number} canvasSize - Canvas dimension (assumes square)
 * @param {string} color - Primary color for the lesson
 * @returns {Array<Object>} Array of command payloads
 */
function lessonLines(canvasSize = 32, color = '#ff0000') {
  const mid = Math.floor(canvasSize / 2);
  const margin = Math.floor(canvasSize * 0.15);
  return [
    // Horizontal line
    shapes.drawLine(margin, mid, canvasSize - margin, mid, color),
    // Vertical line
    shapes.drawLine(mid, margin, mid, canvasSize - margin, '#0000ff'),
    // Diagonal (top-left to bottom-right)
    shapes.drawLine(margin, margin, canvasSize - margin, canvasSize - margin, '#00aa00'),
    // Diagonal (top-right to bottom-left)
    shapes.drawLine(canvasSize - margin, margin, margin, canvasSize - margin, '#ff8800'),
  ];
}

/**
 * Lesson 2: Squares & Rectangles — Understanding right angles and proportions.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonSquares(canvasSize = 32, color = '#1565c0') {
  const margin = Math.floor(canvasSize * 0.1);
  const small = Math.floor(canvasSize * 0.2);
  const large = Math.floor(canvasSize * 0.35);
  return [
    // Small square (outline)
    shapes.drawSquare(margin, margin, small, color, false),
    // Large square (filled)
    shapes.drawSquare(canvasSize - margin - large, margin, large, '#ff7043', true),
    // Rectangle (horizontal)
    shapes.drawRectangle(margin, canvasSize - margin - small, large + small, small, '#4caf50', false),
    // Rectangle (vertical, filled)
    shapes.drawRectangle(canvasSize - margin - small, canvasSize - margin - large, small, large, '#9c27b0', true),
  ];
}

/**
 * Lesson 3: Circles — Learning curves and symmetry.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonCircles(canvasSize = 32, color = '#e91e63') {
  const mid = Math.floor(canvasSize / 2);
  const r1 = Math.floor(canvasSize * 0.15);
  const r2 = Math.floor(canvasSize * 0.3);
  return [
    // Small circle (outline)
    shapes.drawCircle(mid, mid, r1, color, false),
    // Large circle (filled)
    shapes.drawCircle(mid, mid, r2, '#2196f3', true),
    // Small filled circle offset
    shapes.drawCircle(mid + r1, mid - r1, Math.floor(r1 / 2), '#ff9800', true),
  ];
}

/**
 * Lesson 4: Ellipses — Understanding oval shapes and proportions.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonEllipses(canvasSize = 32, color = '#9c27b0') {
  const mid = Math.floor(canvasSize / 2);
  const rx = Math.floor(canvasSize * 0.3);
  const ry = Math.floor(canvasSize * 0.15);
  return [
    // Horizontal ellipse (outline)
    shapes.drawEllipse(mid, mid, rx, ry, color, false),
    // Vertical ellipse (filled)
    shapes.drawEllipse(mid, mid, ry, rx, '#4caf50', true),
    // Small circle-like ellipse
    shapes.drawEllipse(mid + rx, mid - ry, Math.floor(rx / 3), Math.floor(ry / 2), '#ff5722', true),
  ];
}

/**
 * Lesson 5: Triangles — Three-point shapes and stability.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonTriangles(canvasSize = 32, color = '#ff5722') {
  const mid = Math.floor(canvasSize / 2);
  const size = Math.floor(canvasSize * 0.4);
  const margin = Math.floor(canvasSize * 0.1);
  return [
    // Equilateral triangle (outline)
    shapes.drawEquilateralTriangle(mid, mid, size, color, false),
    // Right triangle (filled)
    shapes.drawTriangle([
      { x: margin, y: canvasSize - margin },
      { x: margin, y: margin },
      { x: Math.floor(canvasSize * 0.35), y: canvasSize - margin },
    ], '#3f51b5', true),
    // Inverted triangle
    shapes.drawEquilateralTriangle(mid, mid, Math.floor(size * 0.6), '#009688', true),
  ];
}

/**
 * Lesson 6: Polygons — Multi-sided shapes.
 * @param {number} canvasSize - Canvas dimension
 * @param {string} color - Primary color
 * @returns {Array<Object>} Array of command payloads
 */
function lessonPolygons(canvasSize = 32, color = '#607d8b') {
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);
  return [
    // Pentagon
    shapes.drawRegularPolygon(mid, mid, 5, r, '#4caf50', false),
    // Hexagon (filled)
    shapes.drawRegularPolygon(mid, mid, 6, Math.floor(r * 0.7), '#ff9800', true),
    // Octagon
    shapes.drawRegularPolygon(mid, mid, 8, Math.floor(r * 0.5), '#9c27b0', false),
  ];
}

/**
 * Lesson 7: Composition — Combining basic shapes to create simple objects.
 * @param {number} canvasSize - Canvas dimension
 * @returns {Array<Object>} Array of command payloads
 */
function lessonComposition(canvasSize = 32) {
  const mid = Math.floor(canvasSize / 2);
  const q1 = Math.floor(canvasSize * 0.25);
  const q3 = Math.floor(canvasSize * 0.75);
  const small = Math.floor(canvasSize * 0.1);
  return [
    // House: square body
    shapes.drawSquare(q1, mid, q3 - q1, '#8d6e63', true),
    // House: triangle roof
    shapes.drawTriangle([
      { x: q1 - 1, y: mid },
      { x: mid, y: q1 },
      { x: q3 + 1, y: mid },
    ], '#d32f2f', true),
    // Sun: circle
    shapes.drawCircle(canvasSize - small - 2, small + 2, small, '#ffc107', true),
    // Tree: rectangle trunk
    shapes.drawRectangle(q1 + small, canvasSize - small - 2, Math.floor(small / 2), small, '#5d4037', true),
    // Tree: circle top
    shapes.drawCircle(q1 + Math.floor(small / 4), canvasSize - small - 4, Math.floor(small / 2), '#388e3c', true),
  ];
}

/**
 * Lesson 8: Freehand — Practice freehand drawing with simulated hand tremor.
 */
function lessonFreehand(canvasSize = 32, color = '#795548') {
  const margin = Math.floor(canvasSize * 0.1);
  const points = [];
  let y = Math.floor(canvasSize / 2);
  for (let x = margin; x < canvasSize - margin; x += 2) {
    points.push({ x, y: y + Math.floor(Math.random() * 3) - 1 });
  }
  return shapes.drawPolyline(points, color);
}

/**
 * Lesson 9: Proportions and Angles — Practice maintaining proportions and angles.
 */
function lessonProportionsAndAngles(canvasSize = 32, color = '#3f51b5') {
  const mid = Math.floor(canvasSize / 2);
  const size1 = Math.floor(canvasSize * 0.4);
  const size2 = Math.floor(size1 / 2);
  return [
    shapes.drawSquare(mid - Math.floor(size1/2), mid - Math.floor(size1/2), size1, color, false),
    shapes.drawSquare(mid - Math.floor(size2/2), mid - Math.floor(size2/2), size2, '#e91e63', false),
    shapes.drawLine(mid, mid, mid + size1, mid - size1, '#009688')
  ];
}

/**
 * Lesson 10: Curves — C-curves and S-curves.
 */
function lessonCurves(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const mid = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);
  // C curve
  const cPoints = [];
  for (let i = -Math.PI/2; i <= Math.PI/2; i += 0.2) {
    cPoints.push({ x: Math.round(mid - r - r * Math.cos(i)), y: Math.round(mid / 2 + r * Math.sin(i)) });
  }
  commands.push(...shapes.drawPolyline(cPoints, color));
  // S curve
  const sPoints = [];
  for (let i = -Math.PI/2; i <= Math.PI*1.5; i += 0.2) {
    const isTop = i < Math.PI/2;
    const cy = isTop ? (mid + Math.floor(canvasSize*0.1)) : (mid + Math.floor(canvasSize*0.1) + r*2);
    const signX = isTop ? -1 : 1;
    sPoints.push({ x: Math.round(mid + r + signX * r * Math.cos(i)), y: Math.round(cy + r * Math.sin(i)) });
  }
  commands.push(...shapes.drawPolyline(sPoints, '#e91e63'));
  return commands;
}

/**
 * Lesson 11: Spiral — Drawing spiral curves.
 */
function lessonSpiral(canvasSize = 32, color = '#ff9800') {
  const mid = Math.floor(canvasSize / 2);
  const points = [];
  const maxRadius = Math.floor(canvasSize * 0.4);
  const loops = 3;
  for (let angle = 0; angle < Math.PI * 2 * loops; angle += 0.3) {
    const r = (angle / (Math.PI * 2 * loops)) * maxRadius;
    points.push({ x: Math.round(mid + r * Math.cos(angle)), y: Math.round(mid + r * Math.sin(angle)) });
  }
  return shapes.drawPolyline(points, color);
}

/**
 * Lesson 12: Strokes — Long strokes, short strokes, thick and thin lines.
 */
function lessonStrokes(canvasSize = 32, color = '#2196f3') {
  const margin = Math.floor(canvasSize * 0.1);
  const y1 = Math.floor(canvasSize * 0.3);
  const y2 = Math.floor(canvasSize * 0.5);
  const y3 = Math.floor(canvasSize * 0.7);
  return [
    shapes.drawLine(margin, y1, canvasSize - margin, y1, color),
    shapes.drawLine(margin, y2, Math.floor(canvasSize / 2), y2, '#4caf50'),
    shapes.drawLine(margin, y3, canvasSize - margin, y3, '#f44336'),
    shapes.drawLine(margin, y3 + 1, canvasSize - margin, y3 + 1, '#f44336'),
    shapes.drawLine(margin, y3 + 2, canvasSize - margin, y3 + 2, '#f44336'),
  ];
}

/**
 * Lesson 13: Parallel & Intersecting Lines — Drawing parallel and intersecting lines.
 */
function lessonParallelAndIntersecting(canvasSize = 32, color = '#00bcd4') {
  const margin = Math.floor(canvasSize * 0.1);
  const mid = Math.floor(canvasSize / 2);
  const offset = 4;
  return [
    shapes.drawLine(margin, margin, canvasSize - margin, margin, color),
    shapes.drawLine(margin, margin + offset, canvasSize - margin, margin + offset, color),
    shapes.drawLine(margin, margin + offset * 2, canvasSize - margin, margin + offset * 2, color),
    shapes.drawLine(mid - offset*2, mid, mid + offset*2, canvasSize - margin, '#ff5722'),
    shapes.drawLine(mid + offset*2, mid, mid - offset*2, canvasSize - margin, '#ff5722')
  ];
}

/**
 * Get all available lessons with metadata.
 * @returns {Array<{id: string, name: string, description: string, fn: Function}>}
 */
function getLessonCatalog() {
  return [
    { id: 'lines', name: 'Lines', description: 'Draw horizontal, vertical and diagonal lines', fn: lessonLines },
    { id: 'squares', name: 'Squares & Rectangles', description: 'Understand right angles and proportions', fn: lessonSquares },
    { id: 'circles', name: 'Circles', description: 'Learn curves and symmetry', fn: lessonCircles },
    { id: 'ellipses', name: 'Ellipses', description: 'Understand oval shapes and proportions', fn: lessonEllipses },
    { id: 'triangles', name: 'Triangles', description: 'Three-point shapes and stability', fn: lessonTriangles },
    { id: 'polygons', name: 'Polygons', description: 'Multi-sided shapes', fn: lessonPolygons },
    { id: 'composition', name: 'Composition', description: 'Combine basic shapes to create simple objects', fn: lessonComposition },
    { id: 'freehand', name: 'Freehand Drawing', description: 'Practice freehand drawing without rulers', fn: lessonFreehand },
    { id: 'proportions', name: 'Proportions & Angles', description: 'Practice maintaining proportions and angles', fn: lessonProportionsAndAngles },
    { id: 'curves', name: 'Curves', description: 'C-curves and S-curves', fn: lessonCurves },
    { id: 'spiral', name: 'Spiral', description: 'Drawing spiral curves', fn: lessonSpiral },
    { id: 'strokes', name: 'Stroke Types', description: 'Long strokes, short strokes, thick and thin lines', fn: lessonStrokes },
    { id: 'parallel_intersecting', name: 'Parallel & Intersecting', description: 'Draw parallel and intersecting lines', fn: lessonParallelAndIntersecting },
  ];
}

module.exports = {
  lessonLines,
  lessonSquares,
  lessonCircles,
  lessonEllipses,
  lessonTriangles,
  lessonPolygons,
  lessonComposition,
  lessonFreehand,
  lessonProportionsAndAngles,
  lessonCurves,
  lessonSpiral,
  lessonStrokes,
  lessonParallelAndIntersecting,
  getLessonCatalog,
};