const shapes = require('./shapes');
const perspShapes = require('./perspective_shapes');

/**
 * Lesson: 1-Point Perspective
 */
function lesson1PointPerspective(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const horizonY = Math.floor(canvasSize * 0.4);
  const vpX = Math.floor(canvasSize * 0.5);
  const vpY = horizonY;

  // Horizon & VP
  commands.push(...perspShapes.drawHorizon(canvasSize, horizonY));
  commands.push(...perspShapes.drawVP(vpX, vpY));

  // Box below horizon (seeing top face)
  const w = Math.floor(canvasSize * 0.2);
  const h = Math.floor(canvasSize * 0.15);
  commands.push(...perspShapes.draw1PointBox(vpX, vpY, Math.floor(canvasSize * 0.2), horizonY + Math.floor(canvasSize * 0.2), w, h, 0.4, color));
  
  // Box above horizon (seeing bottom face)
  commands.push(...perspShapes.draw1PointBox(vpX, vpY, Math.floor(canvasSize * 0.6), horizonY - Math.floor(canvasSize * 0.3), w, h, 0.4, '#e91e63'));

  return commands;
}

/**
 * Lesson: 2-Point Perspective
 */
function lesson2PointPerspective(canvasSize = 32, color = '#4caf50') {
  const commands = [];
  const horizonY = Math.floor(canvasSize * 0.5);
  const vp1X = Math.floor(canvasSize * 0.1);
  const vp2X = Math.floor(canvasSize * 0.9);
  
  // Horizon & VPs
  commands.push(...perspShapes.drawHorizon(canvasSize, horizonY));
  commands.push(...perspShapes.drawVP(vp1X, horizonY));
  commands.push(...perspShapes.drawVP(vp2X, horizonY));

  // 2-Point Box straddling the horizon
  const startX = Math.floor(canvasSize * 0.4);
  const startY = Math.floor(canvasSize * 0.3);
  const h = Math.floor(canvasSize * 0.4);
  
  commands.push(...perspShapes.draw2PointBox(vp1X, horizonY, vp2X, horizonY, startX, startY, h, 0.3, 0.4, color));

  return commands;
}

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

function getPerspectiveLessonCatalog() {
  return [
    { id: 'persp_1point', name: '1-Point Perspective', description: 'Horizon, 1 VP, Front vs Receding planes', fn: lesson1PointPerspective },
    { id: 'persp_2point', name: '2-Point Perspective', description: 'Horizon, 2 VPs, Edges facing viewer', fn: lesson2PointPerspective },
    { id: 'persp_3point', name: '3-Point Perspective', description: '3 VPs (Bird\'s eye view)', fn: lesson3PointPerspective },
    { id: 'persp_foreshorten', name: 'Foreshortening', description: 'Cylinder pointing at viewer', fn: lessonForeshortening },
  ];
}

module.exports = {
  lesson1PointPerspective,
  lesson2PointPerspective,
  lesson3PointPerspective,
  lessonForeshortening,
  getPerspectiveLessonCatalog
};
