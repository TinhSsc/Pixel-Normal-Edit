const shapes = require('./shapes');

function drawMetalSphere(cx, cy, r) {
  const commands = [];
  
  // Base sphere (darkest shadow/environment reflection)
  commands.push(shapes.drawCircle(cx, cy, r, '#263238', true));
  
  // High contrast core shadow
  const coreR = Math.floor(r * 0.9);
  commands.push(shapes.drawCircle(cx, cy + Math.floor(r*0.1), coreR, '#1a1a1a', true));

  // Environment reflection (Ground bounce)
  const envR = Math.floor(r * 0.7);
  commands.push(shapes.drawCircle(cx, cy + Math.floor(r*0.3), envR, '#546e7a', true));

  // Sharp light zone
  const lightR = Math.floor(r * 0.6);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.2), cy - Math.floor(r*0.2), lightR, '#cfd8dc', true));

  // VERY sharp highlight (Tiny and pure white)
  const highR = Math.floor(r * 0.1);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.4), cy - Math.floor(r*0.4), highR, '#ffffff', true));

  return commands;
}

function drawMatteSphere(cx, cy, r, colorBase) {
  const commands = [];
  
  // Base sphere (shadow)
  commands.push(shapes.drawCircle(cx, cy, r, '#795548', true)); // Dark brownish shadow

  // Smooth gradation (Halftone)
  const halfR = Math.floor(r * 0.85);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.05), cy - Math.floor(r*0.05), halfR, colorBase, true));

  // Light area
  const lightR = Math.floor(r * 0.6);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.15), cy - Math.floor(r*0.15), lightR, '#ffcc80', true)); // Lighter tone

  // Soft highlight (Large and diffused)
  const highR = Math.floor(r * 0.3);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.25), cy - Math.floor(r*0.25), highR, '#ffe0b2', true));

  return commands;
}

function drawGlassSphere(cx, cy, r) {
  const commands = [];
  
  // Fresnel effect: Edges are brighter/more reflective than the center
  // Base (Outline & Rim light)
  commands.push(shapes.drawCircle(cx, cy, r, '#80deea', true));
  
  // Darker inner area (light passes through)
  const innerR = Math.floor(r * 0.9);
  commands.push(shapes.drawCircle(cx, cy, innerR, '#006064', true));
  
  // Transmitted light hitting the back bottom
  const transR = Math.floor(r * 0.7);
  commands.push(shapes.drawCircle(cx + Math.floor(r*0.1), cy + Math.floor(r*0.2), transR, '#4dd0e1', true));

  // Very center is darkest (least reflection)
  const centerR = Math.floor(r * 0.5);
  commands.push(shapes.drawCircle(cx, cy, centerR, '#00363a', true));

  // Sharp Highlights (Primary and secondary reflections)
  const highR1 = Math.floor(r * 0.15);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.4), cy - Math.floor(r*0.4), highR1, '#ffffff', true));
  
  const highR2 = Math.floor(r * 0.08);
  commands.push(shapes.drawCircle(cx + Math.floor(r*0.3), cy + Math.floor(r*0.4), highR2, '#e0f7fa', true));

  return commands;
}

function drawTexturedSphere(cx, cy, r, type) {
  const commands = [];
  
  // Base sphere
  const baseColor = type === 'wood' ? '#8d6e63' : '#9e9e9e';
  commands.push(shapes.drawCircle(cx, cy, r, baseColor, true));

  // Shadow
  const shadowColor = type === 'wood' ? '#4e342e' : '#616161';
  const shadowR = Math.floor(r * 0.85);
  commands.push(shapes.drawCircle(cx + Math.floor(r*0.1), cy + Math.floor(r*0.1), shadowR, shadowColor, true));

  // Texture application
  if (type === 'wood') {
    // Wood grain lines curving around the sphere
    const grainColor = '#3e2723';
    for (let i = -2; i <= 2; i++) {
      const rx = r * 0.8;
      const ry = r * 0.3 * Math.abs(i) + r * 0.2;
      commands.push(shapes.drawEllipse(cx, cy + (i * Math.floor(r*0.3)), Math.floor(rx), Math.floor(ry), grainColor, false));
    }
  } else if (type === 'stone') {
    // Stone cracks and rough patches
    const crackColor = '#212121';
    // Simplified cracks using polylines
    commands.push(shapes.drawPolyline([
      {x: cx - Math.floor(r*0.5), y: cy - Math.floor(r*0.5)},
      {x: cx - Math.floor(r*0.2), y: cy - Math.floor(r*0.1)},
      {x: cx + Math.floor(r*0.3), y: cy - Math.floor(r*0.2)},
      {x: cx + Math.floor(r*0.6), y: cy + Math.floor(r*0.1)}
    ], crackColor));
    
    commands.push(shapes.drawPolyline([
      {x: cx - Math.floor(r*0.2), y: cy - Math.floor(r*0.1)},
      {x: cx, y: cy + Math.floor(r*0.4)},
      {x: cx - Math.floor(r*0.4), y: cy + Math.floor(r*0.7)}
    ], crackColor));
  }

  // Soft Highlight over texture
  const highColor = type === 'wood' ? '#d7ccc8' : '#e0e0e0';
  const highR = Math.floor(r * 0.4);
  commands.push(shapes.drawCircle(cx - Math.floor(r*0.3), cy - Math.floor(r*0.3), highR, highColor, true));

  return commands;
}

module.exports = {
  drawMetalSphere,
  drawMatteSphere,
  drawGlassSphere,
  drawTexturedSphere
};
