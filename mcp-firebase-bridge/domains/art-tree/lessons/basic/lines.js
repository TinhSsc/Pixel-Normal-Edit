/**
 * Auto-extracted from lessons.js
 */
const shapes = require('../../shapes');

/**
 * lessons.js — Art Tree: Basic Shapes Lessons
 *
 * Layer: Lesson API (built on top of Shape API)
 *
 * Provides structured lessons that guide learners through
 * drawing basic geometric shapes step by step.
 * Each lesson returns a sequence of command payloads.
 */

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

module.exports = { lessonLines };
