const shapes = require('./shapes');

/**
 * Draw a marker at the start of a curve
 */
function drawStartMarker(x, y, color = '#00ff00') {
  return shapes.drawCircle(x, y, 2, color, true);
}

/**
 * Draw an inflection point marker
 */
function drawInflectionMarker(x, y, color = '#ff0000') {
  return shapes.drawCircle(x, y, 2, color, true);
}

/**
 * Calculate quadratic bezier point
 */
function quadraticBezier(p0, p1, p2, t) {
  const x = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
  const y = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);
  return { x, y };
}

/**
 * Draw a quadratic bezier curve as a polyline
 */
function drawQuadraticCurve(p0, p1, p2, color, segments = 20) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(quadraticBezier(p0, p1, p2, t));
  }
  return shapes.drawPolyline(points, color);
}

/**
 * Calculate cubic bezier point
 */
function cubicBezier(p0, p1, p2, p3, t) {
  const x = Math.round(Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * t * t * p2.x + t * t * t * p3.x);
  const y = Math.round(Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * t * t * p2.y + t * t * t * p3.y);
  return { x, y };
}

/**
 * Draw a cubic bezier curve as a polyline
 */
function drawCubicCurve(p0, p1, p2, p3, color, segments = 30) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(cubicBezier(p0, p1, p2, p3, t));
  }
  return shapes.drawPolyline(points, color);
}

/**
 * Draw a direction arrow roughly along the curve at t=0.5
 */
function drawDirectionArrow(p0, p1, p2, p3 = null, color = '#ff0000') {
  const commands = [];
  const t = 0.5;
  const pt = p3 ? cubicBezier(p0, p1, p2, p3, t) : quadraticBezier(p0, p1, p2, t);
  const ptNext = p3 ? cubicBezier(p0, p1, p2, p3, t + 0.1) : quadraticBezier(p0, p1, p2, t + 0.1);
  
  // Calculate angle
  const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
  
  // Draw arrow head
  const arrowLen = 4;
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  
  commands.push(shapes.drawLine(pt.x, pt.y, Math.round(pt.x + arrowLen * Math.cos(a1)), Math.round(pt.y + arrowLen * Math.sin(a1)), color));
  commands.push(shapes.drawLine(pt.x, pt.y, Math.round(pt.x + arrowLen * Math.cos(a2)), Math.round(pt.y + arrowLen * Math.sin(a2)), color));
  
  return commands;
}

module.exports = {
  drawStartMarker,
  drawInflectionMarker,
  quadraticBezier,
  drawQuadraticCurve,
  cubicBezier,
  drawCubicCurve,
  drawDirectionArrow
};
