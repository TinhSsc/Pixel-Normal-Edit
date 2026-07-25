/**
 * Auto-extracted from perspective_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Foreshortening (Depth foreshortening)
 * Drawing a cylinder pointing directly at the viewer
 */
function lessonForeshortening(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  
  // Draw overlapping circles getting larger (coming towards viewer)
  const numCircles = 5;
  const maxR = Math.floor(canvasSize * 0.4);
  const minR = Math.floor(canvasSize * 0.15);
  
  for(let i=0; i<numCircles; i++) {
    const t = i / (numCircles - 1); // 0 to 1
    // Radius grows exponentially to simulate perspective
    const r = minR + (maxR - minR) * (t * t); 
    // Y position shifts slightly to show overlap
    const y = cy - Math.floor(canvasSize * 0.2) + Math.floor(canvasSize * 0.4 * t);
    
    // Draw the circle
    commands.push(shapes.drawCircle(cx, y, Math.floor(r), color, false));
  }
  
  // Draw bounding lines converging
  commands.push(shapes.drawLine(cx - minR, cy - Math.floor(canvasSize * 0.2), cx - maxR, cy + Math.floor(canvasSize * 0.2), '#bdbdbd'));
  commands.push(shapes.drawLine(cx + minR, cy - Math.floor(canvasSize * 0.2), cx + maxR, cy + Math.floor(canvasSize * 0.2), '#bdbdbd'));

  return commands;
}

module.exports = { lessonForeshortening };
