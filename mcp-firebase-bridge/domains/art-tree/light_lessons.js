const shapes = require('./shapes');
const lightShapes = require('./light_shapes');

/**
 * Lesson: 6 Zones of Light (Sphere)
 * Highlight, Light, Halftone, Core shadow, Reflected light, Cast shadow.
 */
function lessonLightZones(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.25);
  
  // Light from top-left (approx -45 degrees or -135 degrees mathematically)
  const lightAngle = -Math.PI * 0.75; 

  // Draw light source
  const lx = cx + Math.floor(r * 2 * Math.cos(lightAngle));
  const ly = cy + Math.floor(r * 2 * Math.sin(lightAngle));
  commands.push(...lightShapes.drawLightSource(lx, ly, Math.floor(canvasSize * 0.05)));

  // Draw shaded sphere
  commands.push(...lightShapes.drawShadedSphere(cx, cy, r, lightAngle));

  return commands;
}

/**
 * Lesson: Light Direction & Intensity (Light direction and plane values)
 * Shows a box with planes facing/turning away from light.
 */
function lessonLightDirection(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.25);
  const h = Math.floor(canvasSize * 0.25);

  // Light from top-left
  const lightAngle = -Math.PI * 0.8; 
  
  const lx = cx - Math.floor(canvasSize * 0.35);
  const ly = cy - Math.floor(canvasSize * 0.35);
  commands.push(...lightShapes.drawLightSource(lx, ly, Math.floor(canvasSize * 0.05)));

  // Draw shaded box
  commands.push(...lightShapes.drawShadedBox(cx, cy, w, h, lightAngle));

  return commands;
}

/**
 * Lesson: Contact Shadow (Point of contact shadow)
 * The darkest area where an object touches the ground.
 */
function lessonContactShadow(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.3);

  // Ground line
  commands.push(shapes.drawLine(0, cy + r, canvasSize, cy + r, '#9e9e9e'));

  // Sphere outline
  commands.push(shapes.drawCircle(cx, cy, r, '#bdbdbd', false));

  // Cast shadow (faint)
  commands.push(shapes.drawEllipse(cx + Math.floor(r*0.5), cy + r, Math.floor(r*1.2), Math.floor(r*0.2), '#757575', true));

  // CONTACT SHADOW (Pitch black, right at the touching point)
  // Draw a very small, very dark ellipse directly under the center
  commands.push(shapes.drawEllipse(cx, cy + r, Math.floor(r * 0.4), 2, '#000000', true));
  commands.push(shapes.drawEllipse(cx, cy + r, Math.floor(r * 0.2), 1, '#000000', true));

  return commands;
}

function getLightLessonCatalog() {
  return [
    { id: 'light_zones', name: '6 Zones of Light', description: 'Highlight to Cast shadow on a sphere', fn: lessonLightZones },
    { id: 'light_dir', name: 'Light Direction', description: 'Planes facing vs turning away from light', fn: lessonLightDirection },
    { id: 'light_contact', name: 'Contact Shadow', description: 'The darkest point where object touches ground', fn: lessonContactShadow },
  ];
}

module.exports = {
  lessonLightZones,
  lessonLightDirection,
  lessonContactShadow,
  getLightLessonCatalog
};
