#!/usr/bin/env node
/**
 * shapes/grid.js — Art Tree: Grid Shape Primitives
 *
 * Grid-related shape drawing functions.
 */


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

module.exports = {
  drawGrid,
};