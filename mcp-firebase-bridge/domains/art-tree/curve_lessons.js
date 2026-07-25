const shapes = require('./shapes');
const curveShapes = require('./curve_shapes');

/**
 * Lesson 1: Curve Types (C, S, Convex, Concave)
 */
function lessonCurveTypes(canvasSize = 32, color = '#2196f3') {
  const margin = Math.floor(canvasSize * 0.1);
  const commands = [];
  
  const w = Math.floor(canvasSize / 2) - margin * 2;
  const h = Math.floor(canvasSize / 2) - margin * 2;

  // C Curve (Top Left)
  const cP0 = { x: margin + w, y: margin };
  const cP1 = { x: margin - w, y: margin + Math.floor(h/2) }; // Pulls curve left
  const cP2 = { x: margin + w, y: margin + h };
  commands.push(...curveShapes.drawQuadraticCurve(cP0, cP1, cP2, color));

  // S Curve (Top Right)
  const sP0 = { x: canvasSize - margin, y: margin };
  const sP1 = { x: canvasSize - margin - w*2, y: margin };
  const sP2 = { x: canvasSize - margin + w, y: margin + h };
  const sP3 = { x: canvasSize - margin - w, y: margin + h };
  commands.push(...curveShapes.drawCubicCurve(sP0, sP1, sP2, sP3, '#e91e63'));

  // Convex (Bottom Left, viewed from bottom)
  const cvxP0 = { x: margin, y: canvasSize - margin };
  const cvxP1 = { x: margin + Math.floor(w/2), y: canvasSize - margin - h };
  const cvxP2 = { x: margin + w, y: canvasSize - margin };
  commands.push(...curveShapes.drawQuadraticCurve(cvxP0, cvxP1, cvxP2, '#4caf50'));

  // Concave (Bottom Right, viewed from bottom)
  const cnvP0 = { x: canvasSize - margin - w, y: canvasSize - margin - Math.floor(h/2) };
  const cnvP1 = { x: canvasSize - margin - Math.floor(w/2), y: canvasSize - margin + h };
  const cnvP2 = { x: canvasSize - margin, y: canvasSize - margin - Math.floor(h/2) };
  commands.push(...curveShapes.drawQuadraticCurve(cnvP0, cnvP1, cnvP2, '#ff9800'));

  return commands;
}

/**
 * Lesson 2: Curve Topology (Closed, Open, Symmetrical, Asymmetrical)
 */
function lessonCurveTopology(canvasSize = 32, color = '#9c27b0') {
  const mid = Math.floor(canvasSize / 2);
  const q = Math.floor(canvasSize / 4);
  const commands = [];

  // Closed Curve (Circle-like using Bezier for demonstration)
  // Since we already have drawCircle, we just draw a circle to represent a closed curve
  commands.push(shapes.drawCircle(q, q, Math.floor(q*0.8), color, false));
  
  // Open Curve (Quadratic)
  commands.push(...curveShapes.drawQuadraticCurve(
    { x: canvasSize - q*1.5, y: q },
    { x: canvasSize - q*0.5, y: q - q/2 },
    { x: canvasSize - q*0.5, y: q + q/2 },
    '#3f51b5'
  ));

  // Symmetrical Curve (Parabola-like)
  commands.push(...curveShapes.drawQuadraticCurve(
    { x: q*0.5, y: canvasSize - q*0.5 },
    { x: q, y: canvasSize - q*1.5 },
    { x: q*1.5, y: canvasSize - q*0.5 },
    '#00bcd4'
  ));

  // Asymmetrical Curve
  commands.push(...curveShapes.drawQuadraticCurve(
    { x: canvasSize - q*1.5, y: canvasSize - q*0.5 },
    { x: canvasSize - q*0.2, y: canvasSize - q*1.8 }, // Pull point is skewed
    { x: canvasSize - q*0.5, y: canvasSize - q*0.5 },
    '#ff5722'
  ));

  return commands;
}

/**
 * Lesson 3: Curve Properties (Start, Direction, Curvature, Inflection, Transition)
 */
function lessonCurveProperties(canvasSize = 32, color = '#607d8b') {
  const margin = Math.floor(canvasSize * 0.1);
  const commands = [];

  // 1. Start point and Direction (Top Left Curve)
  const p0 = { x: margin, y: margin * 2 };
  const p1 = { x: margin + canvasSize*0.3, y: margin };
  const p2 = { x: margin + canvasSize*0.3, y: margin + canvasSize*0.3 };
  commands.push(...curveShapes.drawQuadraticCurve(p0, p1, p2, color));
  commands.push(curveShapes.drawStartMarker(p0.x, p0.y, '#00ff00')); // Green dot at start
  commands.push(...curveShapes.drawDirectionArrow(p0, p1, p2, null, '#ff0000')); // Red arrow

  // 2. Curvature comparison (Bottom Left)
  // Strong vs Weak curve with same endpoints
  const bp0 = { x: margin, y: canvasSize - margin };
  const bp2 = { x: margin + canvasSize*0.4, y: canvasSize - margin };
  // Weak curve
  commands.push(...curveShapes.drawQuadraticCurve(bp0, { x: margin + canvasSize*0.2, y: canvasSize - margin - canvasSize*0.1 }, bp2, '#8bc34a'));
  // Strong curve
  commands.push(...curveShapes.drawQuadraticCurve(bp0, { x: margin + canvasSize*0.2, y: canvasSize - margin - canvasSize*0.4 }, bp2, '#388e3c'));

  // 3. Inflection point (Top Right S Curve)
  const sP0 = { x: canvasSize - margin - canvasSize*0.3, y: margin };
  const sP1 = { x: canvasSize - margin, y: margin };
  const sP2 = { x: canvasSize - margin - canvasSize*0.4, y: margin + canvasSize*0.3 };
  const sP3 = { x: canvasSize - margin, y: margin + canvasSize*0.3 };
  commands.push(...curveShapes.drawCubicCurve(sP0, sP1, sP2, sP3, '#03a9f4'));
  // Inflection point roughly at t=0.5
  const inflection = curveShapes.cubicBezier(sP0, sP1, sP2, sP3, 0.5);
  commands.push(curveShapes.drawInflectionMarker(inflection.x, inflection.y, '#ff9800'));

  // 4. Transition (Bottom Right - line transitioning to curve)
  const startLine = { x: canvasSize - margin - canvasSize*0.3, y: canvasSize - margin - canvasSize*0.2 };
  const transPt = { x: canvasSize - margin - canvasSize*0.1, y: canvasSize - margin - canvasSize*0.2 };
  commands.push(shapes.drawLine(startLine.x, startLine.y, transPt.x, transPt.y, '#9e9e9e'));
  // Curve starting tangentially
  commands.push(...curveShapes.drawQuadraticCurve(transPt, { x: canvasSize - margin, y: canvasSize - margin - canvasSize*0.2 }, { x: canvasSize - margin, y: canvasSize - margin }, '#795548'));

  return commands;
}

function getCurveLessonCatalog() {
  return [
    { id: 'curve_types', name: 'Curve Types', description: 'C, S, Convex, and Concave curves', fn: lessonCurveTypes },
    { id: 'curve_topology', name: 'Curve Topology', description: 'Closed, Open, Symmetrical, Asymmetrical curves', fn: lessonCurveTopology },
    { id: 'curve_properties', name: 'Curve Properties', description: 'Start point, Direction, Curvature, Inflection, and Transitions', fn: lessonCurveProperties },
  ];
}

module.exports = {
  lessonCurveTypes,
  lessonCurveTopology,
  lessonCurveProperties,
  getCurveLessonCatalog
};
