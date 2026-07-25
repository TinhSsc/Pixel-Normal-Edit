const shapes = require('./shapes');
const shapes3d = require('./3d_shapes');

function drawCupAnalysis(cx, cy, r, h) {
  const commands = [];
  const topY = cy - Math.floor(h/2);
  const botY = cy + Math.floor(h/2);
  const topRy = Math.floor(r * 0.3);
  const botRy = Math.floor(r * 0.4);

  // Outer Wall (Convex) - Blue
  commands.push(shapes.drawLine(cx - r, topY, cx - Math.floor(r*0.8), botY, '#2196f3'));
  commands.push(shapes.drawLine(cx + r, topY, cx + Math.floor(r*0.8), botY, '#2196f3'));
  // Base (Flat/Curved)
  commands.push(shapes.drawEllipse(cx, botY, Math.floor(r*0.8), botRy, '#4caf50', false));

  // Inner Wall (Concave) - Purple
  // Draw the back half of the inner ellipse (the visible inside of the cup)
  const innerR = Math.floor(r * 0.9);
  const innerRy = Math.floor(topRy * 0.9);
  // Just draw the full inner ellipse but highlighted differently
  commands.push(shapes.drawEllipse(cx, topY, innerR, innerRy, '#9c27b0', false));

  // Lip / Rim (Transitional edge) - Orange
  // We represent the lip as the gap between the inner and outer ellipses at the top
  commands.push(shapes.drawEllipse(cx, topY, r, topRy, '#ff9800', false));
  
  // Handle (Tube surface) - Red
  // Draw a curved handle on the right side
  const hx = cx + r;
  const hy = cy;
  const hr = Math.floor(h * 0.3);
  // Two nested semi-circles (arcs) for the handle thickness
  const handleOuter = [];
  const handleInner = [];
  for(let i=0; i<=18; i++) {
    const angle = (i/18) * Math.PI - Math.PI/2; // -90 to 90 degrees
    handleOuter.push({ x: Math.round(hx + hr * Math.cos(angle)), y: Math.round(hy + hr * Math.sin(angle)) });
    handleInner.push({ x: Math.round(hx + (hr-5) * Math.cos(angle)), y: Math.round(hy + (hr-5) * Math.sin(angle)) });
  }
  commands.push(shapes.drawPolyline(handleOuter, '#f44336'));
  commands.push(shapes.drawPolyline(handleInner, '#f44336'));

  return commands;
}

function drawChairAnalysis(cx, cy, w) {
  const commands = [];
  const h = Math.floor(w * 1.5);
  const d = Math.floor(w * 0.8);
  const seatY = cy;
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);

  // Seat (Flat plane) - Green
  const fX = cx - Math.floor(w/2);
  const bX = fX + dx;
  const bY = seatY - dy;
  // Seat wireframe
  commands.push(shapes.drawRectangle(fX, seatY, w, 10, '#4caf50', false)); // Front thickness
  commands.push(shapes.drawLine(fX, seatY, bX, bY, '#4caf50'));
  commands.push(shapes.drawLine(fX+w, seatY, bX+w, bY, '#4caf50'));
  commands.push(shapes.drawLine(bX, bY, bX+w, bY, '#4caf50'));

  // Backrest (Flat plane + Hard edges) - Blue
  commands.push(shapes.drawRectangle(bX, bY - Math.floor(h*0.5), w, Math.floor(h*0.5), '#2196f3', false));
  // Inner rungs (Hard edges)
  commands.push(shapes.drawRectangle(bX + 10, bY - Math.floor(h*0.4), 5, Math.floor(h*0.4), '#ff9800', false));
  commands.push(shapes.drawRectangle(bX + w - 15, bY - Math.floor(h*0.4), 5, Math.floor(h*0.4), '#ff9800', false));

  // Legs (Cylindrical surfaces) - Red
  const legH = Math.floor(h*0.4);
  const legR = 3;
  // Front-left
  commands.push(shapes.drawLine(fX+legR, seatY+10, fX+legR, seatY+10+legH, '#f44336'));
  commands.push(shapes.drawLine(fX+10-legR, seatY+10, fX+10-legR, seatY+10+legH, '#f44336'));
  // Front-right
  commands.push(shapes.drawLine(fX+w-10+legR, seatY+10, fX+w-10+legR, seatY+10+legH, '#f44336'));
  commands.push(shapes.drawLine(fX+w-legR, seatY+10, fX+w-legR, seatY+10+legH, '#f44336'));

  return commands;
}

module.exports = {
  drawCupAnalysis,
  drawChairAnalysis
};
