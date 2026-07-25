const shapes = require('./shapes');

// Helper to draw a specific layer of a Cup
function drawLayeredCup(cx, cy, scale, layerIndex) {
  const commands = [];
  const w = Math.floor(scale * 0.4);
  const h = Math.floor(scale * 0.6);
  const r = Math.floor(w / 2);
  const topRy = Math.floor(r * 0.3);
  const botRy = Math.floor(r * 0.25);
  const topY = cy - Math.floor(h/2);
  const botY = cy + Math.floor(h/2);

  switch (layerIndex) {
    case 1: // Reference
      // Draw a "photo frame" indicating where a reference image goes
      const refX = cx - Math.floor(scale*0.4);
      const refY = cy - Math.floor(scale*0.4);
      const refW = Math.floor(scale*0.3);
      const refH = Math.floor(scale*0.3);
      commands.push(shapes.drawRectangle(refX, refY, refW, refH, '#e0e0e0', true));
      commands.push(shapes.drawRectangle(refX, refY, refW, refH, '#9e9e9e', false));
      commands.push(shapes.drawLine(refX, refY, refX+refW, refY+refH, '#9e9e9e'));
      commands.push(shapes.drawLine(refX+refW, refY, refX, refY+refH, '#9e9e9e'));
      break;

    case 2: // Sketch
      // Loose, messy lines (Gesture, proportion bounds)
      const sketchC = '#90caf9'; // Light blue sketch pencil
      commands.push(shapes.drawRectangle(cx - r - 5, topY - topRy - 5, w + 10, h + botRy + 10, sketchC, false));
      // Messy circles/ovals for top and bottom
      commands.push(shapes.drawEllipse(cx, topY, Math.floor(r*1.1), Math.floor(topRy*1.2), sketchC, false));
      commands.push(shapes.drawEllipse(cx+2, topY-2, Math.floor(r*0.9), Math.floor(topRy*0.8), sketchC, false));
      // Messy walls
      commands.push(shapes.drawLine(cx - r - 2, topY, cx - r + 3, botY, sketchC));
      commands.push(shapes.drawLine(cx + r + 2, topY, cx + r - 3, botY, sketchC));
      break;

    case 3: // Construction
      // Precise geometric primitives and axes
      const axisC = '#f44336';
      const constC = '#4caf50';
      // Axis
      commands.push(shapes.drawLine(cx, cy - h, cx, cy + h, axisC));
      // Top ellipse
      commands.push(shapes.drawEllipse(cx, topY, r, topRy, constC, false));
      // Bottom ellipse (full, showing through)
      commands.push(shapes.drawEllipse(cx, botY, r, botRy, constC, false));
      // Straight walls connecting tangents
      commands.push(shapes.drawLine(cx - r, topY, cx - r, botY, constC));
      commands.push(shapes.drawLine(cx + r, topY, cx + r, botY, constC));
      break;

    case 4: // Lineart
      // Clean, solid outer and inner contours
      const lineC = '#000000';
      // Walls
      commands.push(shapes.drawLine(cx - r, topY, cx - r, botY, lineC));
      commands.push(shapes.drawLine(cx + r, topY, cx + r, botY, lineC));
      // Top rim
      commands.push(shapes.drawEllipse(cx, topY, r, topRy, lineC, false));
      // Inner lip
      commands.push(shapes.drawEllipse(cx, topY, Math.floor(r*0.85), Math.floor(topRy*0.85), lineC, false));
      // Front bottom curve (simulate by drawing half an ellipse manually, but we don't have arc tool)
      // We use polyline for the front bottom curve to not show the hidden back
      const frontCurve = [];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI;
        frontCurve.push({ x: Math.round(cx + r * Math.cos(a)), y: Math.round(botY + botRy * Math.sin(a)) });
      }
      commands.push(shapes.drawPolyline(frontCurve, lineC));
      break;

    case 5: // Base Color
      // Flat solid colors for the cup body and interior
      const bodyC = '#ff9800'; // Orange cup
      const innerC = '#795548'; // Coffee inside
      // Body fill (Using wireframe/thick lines to fake fill if needed, or assume SVG renders it)
      // Actually, we can use drawEllipse and rectangle
      commands.push(shapes.drawRectangle(cx - r, topY, w, h, bodyC, true));
      commands.push(shapes.drawEllipse(cx, botY, r, botRy, bodyC, true));
      // Fill the top area
      commands.push(shapes.drawEllipse(cx, topY, r, topRy, bodyC, true));
      // Coffee inside
      commands.push(shapes.drawEllipse(cx, topY, Math.floor(r*0.85), Math.floor(topRy*0.85), innerC, true));
      break;

    case 6: // Shadow
      // Core shadow and Cast shadow (Usually drawn with Multiply blend mode, but here we just draw dark shapes)
      const shadowC = '#424242';
      // Cast shadow on floor
      commands.push(shapes.drawEllipse(cx - Math.floor(w*0.8), botY + Math.floor(botRy*0.5), Math.floor(w*1.2), Math.floor(botRy*1.2), shadowC, true));
      // Core shadow on the left side of the cup body
      commands.push(shapes.drawRectangle(cx - r, topY, Math.floor(r*0.6), h, '#3e2723', true));
      break;

    case 7: // Light
      // Highlights and Rim light (Usually drawn with Screen/Add blend mode, here just bright white/yellow)
      const lightC = '#ffffff';
      // Rim light on the right edge
      commands.push(shapes.drawLine(cx + r - 2, topY, cx + r - 2, botY, lightC));
      // Strong sharp highlight on the body
      commands.push(shapes.drawEllipse(cx + Math.floor(r*0.5), cy, Math.floor(r*0.1), Math.floor(h*0.3), lightC, true));
      // Highlight on the rim
      commands.push(shapes.drawEllipse(cx + Math.floor(r*0.7), topY - Math.floor(topRy*0.5), Math.floor(r*0.2), 2, lightC, true));
      break;

    default:
      break;
  }

  return commands;
}

module.exports = {
  drawLayeredCup
};
