const shapes = require('./shapes');
const ellipseShapes = require('./ellipse_shapes');

/**
 * Draw a lofted 3D form by providing a central axis and cross-sections.
 * @param {number} cx Center X
 * @param {number} topY Top Y of the axis
 * @param {number} bottomY Bottom Y of the axis
 * @param {Array<{y: number, r: number}>} sections Slices sorted from top to bottom (or bottom to top)
 * @param {string} color 
 * @param {boolean} drawAxis Whether to draw the central vertical axis
 */
function drawLoftedForm(cx, topY, bottomY, sections, color, drawAxis = true) {
  const commands = [];
  
  if (drawAxis) {
    commands.push(shapes.drawLine(cx, topY - 5, cx, bottomY + 5, '#bdbdbd'));
  }

  // Sort sections by y to ensure we can connect them properly
  const sorted = [...sections].sort((a, b) => a.y - b.y);

  // Draw ellipses and connect edges
  for (let i = 0; i < sorted.length; i++) {
    const sec = sorted[i];
    const ry = Math.max(2, Math.floor(sec.r * 0.3)); // perspective foreshortening
    
    // Draw cross-section ellipse
    commands.push(shapes.drawEllipse(cx, sec.y, sec.r, ry, color, false));
    
    // Connect to next section's edges
    if (i < sorted.length - 1) {
      const nextSec = sorted[i + 1];
      // Left contour
      commands.push(shapes.drawLine(cx - sec.r, sec.y, cx - nextSec.r, nextSec.y, color));
      // Right contour
      commands.push(shapes.drawLine(cx + sec.r, sec.y, cx + nextSec.r, nextSec.y, color));
    }
  }

  return commands;
}

/**
 * Draw the structural volume of a head using cross sections
 */
function drawHeadStructure(cx, cy, height, color) {
  const commands = [];
  
  const topY = cy - Math.floor(height / 2);
  const bottomY = cy + Math.floor(height / 2);
  
  // 1. Cranium (large sphere at the top)
  const craniumR = Math.floor(height * 0.35);
  const craniumY = topY + craniumR;
  commands.push(shapes.drawCircle(cx, craniumY, craniumR, color, false));
  
  // Cranium cross sections (horizontal and vertical)
  commands.push(shapes.drawEllipse(cx, craniumY, craniumR, Math.floor(craniumR * 0.4), '#03a9f4', false));
  commands.push(shapes.drawEllipse(cx, craniumY, Math.floor(craniumR * 0.3), craniumR, '#03a9f4', false));
  
  // 2. Face & Jaw (narrowing down)
  const jawR = Math.floor(craniumR * 0.6);
  const jawY = bottomY - Math.floor(jawR * 0.5);
  
  // Jaw cross section
  commands.push(shapes.drawEllipse(cx, jawY, jawR, Math.floor(jawR * 0.3), '#e91e63', false));
  
  // Connect Cranium to Jaw (Cheekbones/Jawline)
  // Left side
  commands.push(shapes.drawLine(cx - craniumR, craniumY, cx - jawR, jawY, color));
  // Right side
  commands.push(shapes.drawLine(cx + craniumR, craniumY, cx + jawR, jawY, color));
  
  // Central facial axis (Center line of the face)
  commands.push(shapes.drawLine(cx, topY, cx, bottomY, '#4caf50'));

  return commands;
}

module.exports = {
  drawLoftedForm,
  drawHeadStructure
};
