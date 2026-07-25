
function drawXRayBox(cx, cy, w, h, d, visibleColor, hiddenColor) {
  const commands = [];
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);
  
  const fX = cx - Math.floor(w/2);
  const fY = cy + Math.floor(h/2);

  // Hidden edges (Back, Bottom, Left side)
  // Back face
  const bX = fX + dx;
  const bY = fY - dy;
  commands.push(shapes.drawLine(fX, fY, bX, bY, hiddenColor)); // Bottom left depth
  commands.push(shapes.drawLine(bX, bY, bX + w, bY, hiddenColor)); // Back bottom
  commands.push(shapes.drawLine(bX, bY, bX, bY - h, hiddenColor)); // Back left vertical

  // Visible edges (Front, Top, Right side)
  // Front face
  commands.push(shapes.drawRectangle(fX, fY - h, w, h, visibleColor, false));
  // Top face
  commands.push(shapes.drawLine(fX, fY - h, bX, bY - h, visibleColor));
  commands.push(shapes.drawLine(fX + w, fY - h, bX + w, bY - h, visibleColor));
  commands.push(shapes.drawLine(bX, bY - h, bX + w, bY - h, visibleColor));
  // Right side depth
  commands.push(shapes.drawLine(fX + w, fY, bX + w, bY, visibleColor));
  // Right back vertical
  commands.push(shapes.drawLine(bX + w, bY, bX + w, bY - h, visibleColor));

  return commands;
}

function drawXRayHead(cx, cy, r, visibleColor, hiddenColor) {
  const commands = [];
  
  // Hidden/Structural elements (Cranium sphere behind the face)
  commands.push(shapes.drawCircle(cx, cy, r, hiddenColor, false));
  // Cranium cross-contours (hidden structure)
  commands.push(shapes.drawEllipse(cx, cy, r, Math.floor(r*0.3), hiddenColor, false)); // Equator
  commands.push(shapes.drawEllipse(cx, cy, Math.floor(r*0.3), r, hiddenColor, false)); // Prime meridian

  // Visible features (Face and Jaw)
  const jawY = cy + Math.floor(r * 1.4);
  const jawW = Math.floor(r * 0.6);
  // Cheek lines dropping down
  commands.push(shapes.drawLine(cx - r, cy, cx - jawW, jawY, visibleColor));
  commands.push(shapes.drawLine(cx + r, cy, cx + jawW, jawY, visibleColor));
  // Jaw line
  commands.push(shapes.drawEllipse(cx, jawY, jawW, Math.floor(jawW * 0.4), visibleColor, false));
  // Center facial axis
  commands.push(shapes.drawLine(cx, cy - r, cx, jawY, visibleColor));

  return commands;
}

function drawXRayCup(cx, cy, r, h, visibleColor, hiddenColor) {
  const commands = [];
  const topY = cy - Math.floor(h/2);
  const botY = cy + Math.floor(h/2);
  const ry = Math.floor(r * 0.3);

  // Hidden elements (Inner bottom surface, back curve of outer base)
  // Back curve of the outer base (hidden from viewer)
  commands.push(shapes.drawEllipse(cx, botY, r, ry, hiddenColor, false));
  
  // Inner bottom surface (showing the depth/thickness of the cup bottom)
  const innerBotY = botY - Math.floor(h * 0.1);
  const innerR = Math.floor(r * 0.85);
  const innerRy = Math.floor(ry * 0.85);
  commands.push(shapes.drawEllipse(cx, innerBotY, innerR, innerRy, hiddenColor, false));
  
  // Visible elements (Outer walls, front curve of base, rim, inner wall)
  // Walls
  commands.push(shapes.drawLine(cx - r, topY, cx - r, botY, visibleColor));
  commands.push(shapes.drawLine(cx + r, topY, cx + r, botY, visibleColor));
  // Rim / Lip
  commands.push(shapes.drawEllipse(cx, topY, r, ry, visibleColor, false));
  commands.push(shapes.drawEllipse(cx, topY, innerR, innerRy, visibleColor, false));
  
  // To draw just the front curve of the base in visible color, we approximate with a polyline
  const frontCurve = [];
  for (let i = 0; i <= 18; i++) {
    const angle = (i / 18) * Math.PI; // 0 to 180 degrees (bottom half)
    frontCurve.push({ x: Math.round(cx + r * Math.cos(angle)), y: Math.round(botY + ry * Math.sin(angle)) });
  }
  commands.push(shapes.drawPolyline(frontCurve, visibleColor));

  return commands;
}

module.exports = {
  drawXRayBox,
  drawXRayHead,
  drawXRayCup
};
