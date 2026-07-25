/**
 * Auto-extracted from curve_lessons.js
 */
const shapes = require('../../shapes');

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

module.exports = { lessonCurveTopology };
