#!/usr/bin/env node
/**
 * shapes.js — Art Tree: Basic Shapes API
 *
 * Layer: Shape API (built on top of Core Drawing Primitives)
 *
 * Provides higher-level shape drawing functions that compose
 * the primitive drawLine, drawRect, drawCircle, drawEllipse,
 * drawPolygon calls into more meaningful geometric shapes
 * suitable for art lessons.
 *
 * All functions return command payloads compatible with sendCommand.
 */

const PRIMITIVE_ACTIONS = {
  LINE: 'drawLine',
  RECT: 'drawRect',
  CIRCLE: 'drawCircle',
  ELLIPSE: 'drawEllipse',
  POLYGON: 'drawPolygon',
  PIXEL: 'drawPixel',
};

/**
 * Draw a straight line between two points.
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} x1 - End X
 * @param {number} y1 - End Y
 * @param {string} color - Hex color
 * @returns {Object} Command payload
 */
function drawLine(x0, y0, x1, y1, color) {
  return { action: PRIMITIVE_ACTIONS.LINE, x0, y0, x1, y1, color };
}

/**
 * Draw a square (aligned to axes).
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} size - Side length
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawSquare(x, y, size, color, filled = false) {
  return { action: PRIMITIVE_ACTIONS.RECT, x, y, w: size, h: size, color, filled };
}

/**
 * Draw a rectangle (aligned to axes).
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawRectangle(x, y, w, h, color, filled = false) {
  return { action: PRIMITIVE_ACTIONS.RECT, x, y, w, h, color, filled };
}

/**
 * Draw a circle.
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r - Radius
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawCircle(cx, cy, r, color, filled = false) {
  return { action: PRIMITIVE_ACTIONS.CIRCLE, cx, cy, r, color, filled };
}

/**
 * Draw an ellipse.
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} rx - Horizontal radius
 * @param {number} ry - Vertical radius
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawEllipse(cx, cy, rx, ry, color, filled = false) {
  return { action: PRIMITIVE_ACTIONS.ELLIPSE, cx, cy, rx, ry, color, filled };
}

/**
 * Draw a triangle from three vertices.
 * @param {Array<{x: number, y: number}>} vertices - Three vertices
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawTriangle(vertices, color, filled = false) {
  if (vertices.length !== 3) {
    throw new Error('Triangle requires exactly 3 vertices');
  }
  return { action: PRIMITIVE_ACTIONS.POLYGON, points: vertices, color, filled };
}

/**
 * Draw a regular triangle (equilateral) centered at (cx, cy).
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} sideLength - Length of each side
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawEquilateralTriangle(cx, cy, sideLength, color, filled = false) {
  const h = (Math.sqrt(3) / 2) * sideLength;
  const vertices = [
    { x: Math.round(cx), y: Math.round(cy - h * 2 / 3) },
    { x: Math.round(cx - sideLength / 2), y: Math.round(cy + h / 3) },
    { x: Math.round(cx + sideLength / 2), y: Math.round(cy + h / 3) },
  ];
  return drawTriangle(vertices, color, filled);
}

/**
 * Draw a polygon from a list of points.
 * @param {Array<{x: number, y: number}>} points - Array of vertices (min 3)
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawPolygon(points, color, filled = false) {
  return { action: PRIMITIVE_ACTIONS.POLYGON, points, color, filled };
}

/**
 * Draw a regular polygon centered at (cx, cy).
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} sides - Number of sides (3+)
 * @param {number} radius - Distance from center to vertices
 * @param {string} color - Hex color
 * @param {boolean} [filled=false] - Fill interior
 * @returns {Object} Command payload
 */
function drawRegularPolygon(cx, cy, sides, radius, color, filled = false) {
  const angleStep = (2 * Math.PI) / sides;
  const points = [];
  // Start from top (-PI/2) for natural orientation
  const startAngle = -Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    });
  }
  return drawPolygon(points, color, filled);
}

/**
 * Draw a grid of squares (useful for pixel art foundation lessons).
 * @param {number} startX - Top-left X
 * @param {number} startY - Top-left Y
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {number} cellSize - Size of each cell
 * @param {string} color - Grid line color
 * @returns {Array<Object>} Array of command payloads
 */
function drawGrid(startX, startY, cols, rows, cellSize, color) {
  const commands = [];
  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = startY + r * cellSize;
    commands.push(drawLine(startX, y, startX + cols * cellSize, y, color));
  }
  // Vertical lines
  for (let c = 0; c <= cols; c++) {
    const x = startX + c * cellSize;
    commands.push(drawLine(x, startY, x, startY + rows * cellSize, color));
  }
  return commands;
}

/**
 * Draw a continuous polyline from a list of points.
 * @param {Array<{x: number, y: number}>} points - Array of vertices
 * @param {string} color - Hex color
 * @returns {Array<Object>} Array of Command payloads
 */
function drawPolyline(points, color) {
  const commands = [];
  for (let i = 0; i < points.length - 1; i++) {
    commands.push(drawLine(points[i].x, points[i].y, points[i+1].x, points[i+1].y, color));
  }
  return commands;
}

module.exports = {
  PRIMITIVE_ACTIONS,
  drawLine,
  drawPolyline,
  drawSquare,
  drawRectangle,
  drawCircle,
  drawEllipse,
  drawTriangle,
  drawEquilateralTriangle,
  drawPolygon,
  drawRegularPolygon,
  drawGrid,
};