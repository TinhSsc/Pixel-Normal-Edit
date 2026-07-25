/**
 * Auto-extracted from curve_lessons.js
 */
const shapes = require('../../shapes');

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

module.exports = { lessonCurveProperties };
