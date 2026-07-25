/**
 * Auto-extracted from curve_lessons.js
 */
const shapes = require('../../shapes');

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

module.exports = { lessonCurveTypes };
