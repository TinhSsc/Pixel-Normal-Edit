/**
 * Auto-extracted from perspective_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: 3-Point Perspective (Bird's eye view)
 */
function lesson3PointPerspective(canvasSize = 32, color = '#ff9800') {
  const commands = [];
  const horizonY = Math.floor(canvasSize * 0.2);
  const vp1X = Math.floor(canvasSize * 0.1);
  const vp2X = Math.floor(canvasSize * 0.9);
  const vp3X = Math.floor(canvasSize * 0.5);
  const vp3Y = Math.floor(canvasSize * 1.5); // VP3 far below (Bird's eye)
  
  // Horizon & VPs
  commands.push(...perspShapes.drawHorizon(canvasSize, horizonY));
  commands.push(...perspShapes.drawVP(vp1X, horizonY));
  commands.push(...perspShapes.drawVP(vp2X, horizonY));
  // VP3 is usually off-canvas, but we draw a line to it to show direction
  
  // We approximate a 3-point box by drawing converging vertical lines to VP3
  const topY = Math.floor(canvasSize * 0.4);
  const h = Math.floor(canvasSize * 0.4);
  
  // Center edge converging to VP3
  commands.push(shapes.drawLine(vp3X, topY, vp3X, topY+h, color)); // simplified
  commands.push(shapes.drawLine(vp3X, topY+h, vp3X, vp3Y, '#e0e0e0')); // Guide to VP3
  
  // Left and Right top edges to VP1, VP2
  commands.push(shapes.drawLine(vp3X, topY, vp1X, horizonY, '#e0e0e0'));
  commands.push(shapes.drawLine(vp3X, topY, vp2X, horizonY, '#e0e0e0'));
  
  // Draw the rest of the box structure to simulate 3-point
  const lX = vp3X - Math.floor(canvasSize * 0.15);
  const rX = vp3X + Math.floor(canvasSize * 0.2);
  // Vertical edges also converge to VP3 slightly (foreshortening)
  commands.push(shapes.drawLine(lX, topY + Math.floor(canvasSize * 0.1), lX + 2, topY + h, color));
  commands.push(shapes.drawLine(rX, topY + Math.floor(canvasSize * 0.15), rX - 3, topY + h - 5, color));

  return commands;
}

module.exports = { lesson3PointPerspective };
