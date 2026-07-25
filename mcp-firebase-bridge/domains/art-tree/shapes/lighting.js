
function drawLightSource(cx, cy, r) {
  const commands = [];
  const color = '#ffeb3b'; // Yellow sun
  commands.push(shapes.drawCircle(cx, cy, r, color, true));
  
  // Rays
  const rayL = Math.floor(r * 1.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * Math.PI;
    const x1 = Math.round(cx + (r + 2) * Math.cos(a));
    const y1 = Math.round(cy + (r + 2) * Math.sin(a));
    const x2 = Math.round(cx + (r + rayL) * Math.cos(a));
    const y2 = Math.round(cy + (r + rayL) * Math.sin(a));
    commands.push(shapes.drawLine(x1, y1, x2, y2, color));
  }
  return commands;
}

function drawShadedSphere(cx, cy, r, lightAngle) {
  const commands = [];
  
  // We simulate shading using overlapping crescent shapes or offset circles
  // Since we have limited primitives, we'll draw concentric offset circles
  // from dark to light towards the light source.

  const offX = Math.cos(lightAngle);
  const offY = Math.sin(lightAngle);

  // 1. Cast Shadow on the ground
  // Drawn first so it's behind the sphere
  // Shift cast shadow away from light
  const castR = Math.floor(r * 1.2);
  const castRy = Math.floor(r * 0.3);
  const castX = cx - Math.floor(offX * r * 0.8);
  const castY = cy + r - Math.floor(castRy/2);
  commands.push(shapes.drawEllipse(castX, castY, castR, castRy, '#424242', true));

  // 2. Base Sphere (Reflected Light zone color)
  // The very edge away from light gets some bounce light
  commands.push(shapes.drawCircle(cx, cy, r, '#78909c', true));

  // 3. Core Shadow (main shadow zone)
  // Offset slightly away from light
  const coreR = Math.floor(r * 0.9);
  const coreX = cx - Math.floor(offX * r * 0.1);
  const coreY = cy - Math.floor(offY * r * 0.1);
  commands.push(shapes.drawCircle(coreX, coreY, coreR, '#263238', true));

  // 4. Halftone (mid-tone zone)
  const halfR = Math.floor(r * 0.75);
  const halfX = cx + Math.floor(offX * r * 0.1);
  const halfY = cy + Math.floor(offY * r * 0.1);
  commands.push(shapes.drawCircle(halfX, halfY, halfR, '#546e7a', true));

  // 5. Light zone
  const lightR = Math.floor(r * 0.5);
  const lightX = cx + Math.floor(offX * r * 0.3);
  const lightY = cy + Math.floor(offY * r * 0.3);
  commands.push(shapes.drawCircle(lightX, lightY, lightR, '#90a4ae', true));

  // 6. Highlight (bright spot)
  const highR = Math.floor(r * 0.15);
  const highX = cx + Math.floor(offX * r * 0.5);
  const highY = cy + Math.floor(offY * r * 0.5);
  commands.push(shapes.drawCircle(highX, highY, highR, '#ffffff', true));

  return commands;
}

function drawShadedBox(cx, cy, w, h, lightAngle) {
  const commands = [];
  const d = Math.floor(w * 0.6);
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);
  
  const fX = cx - Math.floor(w/2);
  const fY = cy + Math.floor(h/2);
  const bX = fX + dx;
  const bY = fY - dy;

  // Assume light is from Top-Left or Top-Right
  const isLightLeft = Math.cos(lightAngle) < 0;

  // Determine values (colors) for planes based on light
  // Top is usually Light (facing up towards light source)
  const topColor = '#cfd8dc';
  // Front and Side depend on left/right light
  const frontColor = isLightLeft ? '#90a4ae' : '#455a64'; // If light is left, front gets some light. If right, front is darker.
  const sideColor = isLightLeft ? '#455a64' : '#90a4ae';

  // Cast Shadow
  const castX = isLightLeft ? bX + w : fX - w;
  const castY = fY;
  // A simple polygon for cast shadow
  const shadowPts = [
    {x: fX, y: fY},
    {x: fX + w, y: fY},
    {x: castX, y: castY - dy},
    {x: castX - w, y: castY - dy}
  ];
  commands.push(shapes.drawPolyline(shadowPts, '#424242'));

  // Draw solid planes
  // Note: Since we don't have a fillPolygon tool natively exposed that supports all shapes easily,
  // we will draw wireframes with heavy lines or crosshatching to represent values.
  // Actually, we can just use drawRectangle for front.
  
  // Front face (solid)
  commands.push(shapes.drawRectangle(fX, fY - h, w, h, frontColor, true));
  
  // Side face (Right) (wireframe/hatch for now, or just outline)
  // Let's use outline with thick color
  const rightSidePts = [
    {x: fX+w, y: fY-h}, {x: bX+w, y: bY-h}, {x: bX+w, y: bY}, {x: fX+w, y: fY}
  ];
  commands.push(shapes.drawPolyline(rightSidePts, sideColor));
  // Add some hatch lines to simulate fill
  commands.push(shapes.drawLine(fX+w, fY-Math.floor(h/2), bX+w, bY-Math.floor(h/2), sideColor));

  // Top face
  const topPts = [
    {x: fX, y: fY-h}, {x: bX, y: bY-h}, {x: bX+w, y: bY-h}, {x: fX+w, y: fY-h}
  ];
  commands.push(shapes.drawPolyline(topPts, topColor));
  commands.push(shapes.drawLine(fX+Math.floor(w/2), fY-h, bX+Math.floor(w/2), bY-h, topColor));

  return commands;
}

module.exports = {
  drawLightSource,
  drawShadedSphere,
  drawShadedBox
};
