
function drawHorizon(canvasSize, yPos) {
  const commands = [];
  // Horizon line (Eye level)
  commands.push(shapes.drawLine(0, yPos, canvasSize, yPos, '#9e9e9e'));
  return commands;
}

function drawVP(x, y) {
  // Red dot for vanishing point
  return [shapes.drawCircle(x, y, 2, '#ff0000', true)];
}

function draw1PointBox(vpX, vpY, fX, fY, w, h, depthFactor, color) {
  const commands = [];
  // Front face (Front-facing plane)
  commands.push(shapes.drawRectangle(fX, fY, w, h, color, false));
  
  // Orthogonal lines to VP (Depth lines)
  const guideColor = '#e0e0e0';
  commands.push(shapes.drawLine(fX, fY, vpX, vpY, guideColor));
  commands.push(shapes.drawLine(fX+w, fY, vpX, vpY, guideColor));
  commands.push(shapes.drawLine(fX, fY+h, vpX, vpY, guideColor));
  commands.push(shapes.drawLine(fX+w, fY+h, vpX, vpY, guideColor));

  // Back face (Receding plane calculation)
  // Distance from front face to VP
  const dTLx = vpX - fX;
  const dTLy = vpY - fY;
  
  // Back face coordinates based on depth factor (0 to 1)
  const bX = fX + Math.floor(dTLx * depthFactor);
  const bY = fY + Math.floor(dTLy * depthFactor);
  const bW = Math.floor(w * (1 - depthFactor));
  const bH = Math.floor(h * (1 - depthFactor));
  
  commands.push(shapes.drawRectangle(bX, bY, bW, bH, color, false));
  
  // Connect corners
  commands.push(shapes.drawLine(fX, fY, bX, bY, color));
  commands.push(shapes.drawLine(fX+w, fY, bX+bW, bY, color));
  commands.push(shapes.drawLine(fX, fY+h, bX, bY+bH, color));
  commands.push(shapes.drawLine(fX+w, fY+h, bX+bW, bY+bH, color));

  return commands;
}

function draw2PointBox(vp1X, vp1Y, vp2X, vp2Y, startX, startY, h, depth1, depth2, color) {
  const commands = [];
  const guideColor = '#e0e0e0';
  
  // Center vertical edge (faces viewer)
  commands.push(shapes.drawLine(startX, startY, startX, startY + h, color));
  
  // Orthogonals to VP1 (Left)
  commands.push(shapes.drawLine(startX, startY, vp1X, vp1Y, guideColor));
  commands.push(shapes.drawLine(startX, startY + h, vp1X, vp1Y, guideColor));
  
  // Orthogonals to VP2 (Right)
  commands.push(shapes.drawLine(startX, startY, vp2X, vp2Y, guideColor));
  commands.push(shapes.drawLine(startX, startY + h, vp2X, vp2Y, guideColor));
  
  // Left vertical edge
  const lX = startX + Math.floor((vp1X - startX) * depth1);
  const lY1 = startY + Math.floor((vp1Y - startY) * depth1);
  const lY2 = (startY + h) + Math.floor((vp1Y - (startY + h)) * depth1);
  commands.push(shapes.drawLine(lX, lY1, lX, lY2, color));
  commands.push(shapes.drawLine(startX, startY, lX, lY1, color));
  commands.push(shapes.drawLine(startX, startY+h, lX, lY2, color));

  // Right vertical edge
  const rX = startX + Math.floor((vp2X - startX) * depth2);
  const rY1 = startY + Math.floor((vp2Y - startY) * depth2);
  const rY2 = (startY + h) + Math.floor((vp2Y - (startY + h)) * depth2);
  commands.push(shapes.drawLine(rX, rY1, rX, rY2, color));
  commands.push(shapes.drawLine(startX, startY, rX, rY1, color));
  commands.push(shapes.drawLine(startX, startY+h, rX, rY2, color));

  // Back vertical edge (intersection of lines from left/right edges to opposite VPs)
  // For simplicity, we just draw the top and bottom back lines converging to VPs
  commands.push(shapes.drawLine(lX, lY1, vp2X, vp2Y, guideColor));
  commands.push(shapes.drawLine(rX, rY1, vp1X, vp1Y, guideColor));
  
  // Approximate intersection for top back corner
  // (In a full implementation, we'd calculate line intersection, here we just show the structure)
  
  return commands;
}

module.exports = {
  drawHorizon,
  drawVP,
  draw1PointBox,
  draw2PointBox
};
