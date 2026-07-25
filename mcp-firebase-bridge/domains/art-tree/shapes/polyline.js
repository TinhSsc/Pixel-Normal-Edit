#!/usr/bin/env node
/**
 * shapes/polyline.js — Art Tree: Polyline Shape Primitives
 *
 * Polyline-related shape drawing functions.
 */


/**
 * Draw a continuous polyline from a list of points.
 * @param {Array<{x: number, y: number}>} points - Array of vertices
 * @param {string} color - Hex color
 * @returns {Array<Object>} Array of command payloads
 */
function drawPolyline(points, color) {
  const commands = [];
  for (let i = 0; i < points.length - 1; i++) {
    commands.push(drawLine(points[i].x, points[i].y, points[i+1].x, points[i+1].y, color));
  }
  return commands;
}

module.exports = {
  drawPolyline,
};