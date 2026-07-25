const shapes = require('./shapes');
const lightShapes = require('./light_shapes');

// Master function to draw the Teapot at a specific analytical step
function drawTeapotAnalysis(cx, cy, scale, step, color = '#2196f3') {
  const commands = [];
  const r = Math.floor(scale * 0.3); // Main body radius
  
  // Base outlines for the Teapot used across multiple steps
  const drawBaseOutline = (c) => {
    // Body (Sphere)
    commands.push(shapes.drawCircle(cx, cy, r, c, false));
    // Base/Foot
    commands.push(shapes.drawLine(cx - Math.floor(r*0.6), cy + r, cx + Math.floor(r*0.6), cy + r, c));
    commands.push(shapes.drawLine(cx - Math.floor(r*0.6), cy + r, cx - Math.floor(r*0.7), cy + r + 5, c));
    commands.push(shapes.drawLine(cx + Math.floor(r*0.6), cy + r, cx + Math.floor(r*0.7), cy + r + 5, c));
    commands.push(shapes.drawLine(cx - Math.floor(r*0.7), cy + r + 5, cx + Math.floor(r*0.7), cy + r + 5, c));
    // Lid
    commands.push(shapes.drawLine(cx - Math.floor(r*0.6), cy - r, cx + Math.floor(r*0.6), cy - r, c));
    commands.push(shapes.drawEllipse(cx, cy - r - 5, Math.floor(r*0.6), Math.floor(r*0.2), c, false));
    commands.push(shapes.drawCircle(cx, cy - r - 15, Math.floor(r*0.15), c, false)); // Knob
    // Spout (Left)
    commands.push(shapes.drawLine(cx - r, cy, cx - Math.floor(r*1.8), cy - Math.floor(r*0.8), c));
    commands.push(shapes.drawLine(cx - Math.floor(r*0.8), cy + Math.floor(r*0.4), cx - Math.floor(r*1.5), cy - Math.floor(r*0.6), c));
    commands.push(shapes.drawLine(cx - Math.floor(r*1.8), cy - Math.floor(r*0.8), cx - Math.floor(r*1.5), cy - Math.floor(r*0.6), c));
    // Handle (Right)
    const handlePts1 = [], handlePts2 = [];
    for(let i=0; i<=10; i++) {
      const a = -Math.PI/2 + (i/10)*Math.PI; // -90 to 90
      handlePts1.push({x: Math.round(cx + r + Math.floor(r*0.8)*Math.cos(a)), y: Math.round(cy - Math.floor(r*0.2) + Math.floor(r*0.6)*Math.sin(a))});
      handlePts2.push({x: Math.round(cx + r + Math.floor(r*0.5)*Math.cos(a)), y: Math.round(cy - Math.floor(r*0.2) + Math.floor(r*0.6)*Math.sin(a))});
    }
    commands.push(shapes.drawPolyline(handlePts1, c));
    commands.push(shapes.drawPolyline(handlePts2, c));
  };

  switch (step) {
    case 1: // Silhouette (Flat black)
      // Since we can't easily union-fill all paths, we simulate it by drawing the base thick
      // For this, we just draw the outline in solid black with no inner details
      drawBaseOutline('#000000');
      break;
    
    case 2: // Proportions (Bounding box)
      drawBaseOutline('#e0e0e0');
      // Bounding box
      const minX = cx - Math.floor(r*1.8) - 10;
      const maxX = cx + Math.floor(r*1.8) + 10;
      const minY = cy - r - 30;
      const maxY = cy + r + 15;
      commands.push(shapes.drawRectangle(minX, minY, maxX - minX, maxY - minY, color, false));
      // Center lines of bounding box
      commands.push(shapes.drawLine(cx, minY, cx, maxY, '#ff9800'));
      commands.push(shapes.drawLine(minX, cy, maxX, cy, '#ff9800'));
      break;

    case 3: // Axis (X, Y, Z structural lines)
      drawBaseOutline('#e0e0e0');
      // Y axis
      commands.push(shapes.drawLine(cx, cy - r - 40, cx, cy + r + 40, '#f44336'));
      // X axis
      commands.push(shapes.drawLine(cx - r - 40, cy, cx + r + 40, cy, '#4caf50'));
      // Z axis (depth, diagonal)
      commands.push(shapes.drawLine(cx - Math.floor(r*0.5), cy + Math.floor(r*0.5), cx + Math.floor(r*0.5), cy - Math.floor(r*0.5), '#2196f3'));
      break;

    case 4: // Main Masses (Primitives)
      drawBaseOutline('#e0e0e0');
      // Highlight the sphere
      commands.push(shapes.drawCircle(cx, cy, r, '#e91e63', false));
      // Highlight the spout cylinder/cone
      commands.push(shapes.drawLine(cx - r, cy, cx - Math.floor(r*1.8), cy - Math.floor(r*0.8), '#00bcd4'));
      commands.push(shapes.drawLine(cx - Math.floor(r*0.8), cy + Math.floor(r*0.4), cx - Math.floor(r*1.5), cy - Math.floor(r*0.6), '#00bcd4'));
      break;

    case 5: // Cross-sections
      drawBaseOutline('#e0e0e0');
      // Slicing ellipses on the body
      commands.push(shapes.drawEllipse(cx, cy, r, Math.floor(r*0.3), '#9c27b0', false));
      commands.push(shapes.drawEllipse(cx, cy - Math.floor(r*0.5), Math.floor(r*0.86), Math.floor(r*0.25), '#9c27b0', false));
      commands.push(shapes.drawEllipse(cx, cy + Math.floor(r*0.5), Math.floor(r*0.86), Math.floor(r*0.25), '#9c27b0', false));
      break;

    case 6: // Transformations (Bend, Taper)
      drawBaseOutline('#e0e0e0');
      // Highlight bending spout
      commands.push(shapes.drawEllipse(cx - Math.floor(r*1.4), cy - Math.floor(r*0.4), Math.floor(r*0.4), Math.floor(r*0.2), '#ff9800', false));
      // Tapering lid
      commands.push(shapes.drawLine(cx - Math.floor(r*0.6), cy - r, cx, cy - r - 15, '#ff9800'));
      commands.push(shapes.drawLine(cx + Math.floor(r*0.6), cy - r, cx, cy - r - 15, '#ff9800'));
      break;

    case 7: // Secondary parts
      drawBaseOutline('#e0e0e0');
      // Boldly highlight spout and handle
      commands.push(shapes.drawLine(cx - r, cy, cx - Math.floor(r*1.8), cy - Math.floor(r*0.8), '#ff5722'));
      commands.push(shapes.drawLine(cx - Math.floor(r*0.8), cy + Math.floor(r*0.4), cx - Math.floor(r*1.5), cy - Math.floor(r*0.6), '#ff5722'));
      const hPts = [];
      for(let i=0; i<=10; i++) {
        const a = -Math.PI/2 + (i/10)*Math.PI;
        hPts.push({x: Math.round(cx + r + Math.floor(r*0.8)*Math.cos(a)), y: Math.round(cy - Math.floor(r*0.2) + Math.floor(r*0.6)*Math.sin(a))});
      }
      commands.push(shapes.drawPolyline(hPts, '#3f51b5'));
      break;

    case 8: // Surfaces (Convex, Concave)
      drawBaseOutline('#e0e0e0');
      // Convex body
      commands.push(shapes.drawCircle(cx, cy, r, '#8bc34a', false));
      // Concave inner handle space
      commands.push(shapes.drawEllipse(cx + r + Math.floor(r*0.2), cy - Math.floor(r*0.2), Math.floor(r*0.3), Math.floor(r*0.5), '#00bcd4', false));
      break;

    case 9: // Perspective
      drawBaseOutline(color);
      // Horizon line above
      const horizonY = cy - r - 50;
      const vpX = cx + Math.floor(r*2);
      commands.push(shapes.drawLine(0, horizonY, scale*2, horizonY, '#9e9e9e'));
      commands.push(shapes.drawCircle(vpX, horizonY, 3, '#ff0000', true));
      // Orthogonals from top and bottom to VP
      commands.push(shapes.drawLine(cx, cy - r, vpX, horizonY, '#bdbdbd'));
      commands.push(shapes.drawLine(cx, cy + r, vpX, horizonY, '#bdbdbd'));
      break;

    case 10: // Lighting
      // Re-use shaded sphere for the main body
      commands.push(...lightShapes.drawShadedSphere(cx, cy, r, -Math.PI*0.75));
      // We skip the detailed spout/handle shading to stay within line limits, 
      // but draw them solidly over the sphere to complete the form
      const c = '#546e7a';
      commands.push(shapes.drawLine(cx - r, cy, cx - Math.floor(r*1.8), cy - Math.floor(r*0.8), c));
      commands.push(shapes.drawLine(cx - Math.floor(r*0.8), cy + Math.floor(r*0.4), cx - Math.floor(r*1.5), cy - Math.floor(r*0.6), c));
      break;

    default:
      drawBaseOutline(color);
      break;
  }

  return commands;
}

module.exports = {
  drawTeapotAnalysis
};
