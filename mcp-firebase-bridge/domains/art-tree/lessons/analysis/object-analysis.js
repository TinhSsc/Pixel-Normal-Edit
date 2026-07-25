/**
 * Auto-extracted from analysis_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Object Analysis (Capstone)
 * A 10-step breakdown of a Teapot.
 * Users can supply the step number (1 to 10) to see a specific layer of analysis.
 */
function lessonObjectAnalysis(canvasSize = 32, step = 1, color = '#2196f3') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  
  // Ensure step is between 1 and 10
  const validStep = Math.max(1, Math.min(10, step));

  return analysisShapes.drawTeapotAnalysis(cx, cy, canvasSize, validStep, color);
}

module.exports = { lessonObjectAnalysis };
