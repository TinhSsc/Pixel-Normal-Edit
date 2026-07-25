const shapes = require('./shapes');
const transformShapes = require('./transform_shapes');
const csShapes = require('./cross_section_shapes');

/**
 * Lesson: Stretch (Elongate)
 * Sphere -> Egg, Box -> Bar
 */
function lessonStretch(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.25);
  const qX2 = Math.floor(canvasSize * 0.75);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);

  // 1. Stretch: Sphere -> Egg
  commands.push(shapes.drawCircle(qX1, cy, r, '#bdbdbd', false)); // Original sphere (ghost)
  commands.push(...transformShapes.drawEgg(qX1, cy, r, color)); // Stretched into egg

  // 2. Stretch: Box -> Bar (Tall)
  const w = Math.floor(canvasSize * 0.15);
  // Original box (ghost)
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w/2, w, w, '#bdbdbd', false));
  // Stretched bar
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w * 1.5, w, w * 3, '#9c27b0', false));

  return commands;
}

/**
 * Lesson: Squash (Compress)
 * Sphere -> Disk, Box -> Plate
 */
function lessonSquash(canvasSize = 32, color = '#ff9800') {
  const commands = [];
  const qX1 = Math.floor(canvasSize * 0.25);
  const qX2 = Math.floor(canvasSize * 0.75);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.15);

  // 1. Squash: Sphere -> Disk
  commands.push(shapes.drawCircle(qX1, cy, r, '#bdbdbd', false)); // Original
  // Squashed into a flat ellipse/disk
  commands.push(shapes.drawEllipse(qX1, cy, r * 1.2, Math.floor(r * 0.3), color, false)); 

  // 2. Squash: Box -> Plate
  const w = Math.floor(canvasSize * 0.2);
  commands.push(shapes.drawRectangle(qX2 - w/2, cy - w/2, w, w, '#bdbdbd', false)); // Original
  // Squashed into plate
  commands.push(shapes.drawRectangle(qX2 - w, cy - Math.floor(w*0.2), w * 2, Math.floor(w*0.4), '#4caf50', false));

  return commands;
}

/**
 * Lesson: Taper & Swell (Narrow or bulge)
 * Cylinder -> Bottle
 */
function lessonTaperSwell(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const totalH = Math.floor(canvasSize * 0.8);
  const topY = Math.floor(canvasSize * 0.1);
  const bottomY = topY + totalH;
  const r = Math.floor(canvasSize * 0.25);

  // Original Cylinder (ghost)
  commands.push(shapes.drawLine(cx - r, topY, cx - r, bottomY, '#bdbdbd'));
  commands.push(shapes.drawLine(cx + r, topY, cx + r, bottomY, '#bdbdbd'));

  // Tapered and Swelled form (Bottle)
  const sections = [
    { y: topY, r: Math.floor(r * 0.3) },         // Neck (Tapered)
    { y: topY + Math.floor(totalH * 0.4), r: r },// Body (Swelled back to original radius)
    { y: bottomY, r: Math.floor(r * 0.8) }       // Base (Slightly tapered)
  ];
  commands.push(...csShapes.drawLoftedForm(cx, topY, bottomY, sections, color, true));

  return commands;
}

/**
 * Lesson: Bend (Curved bending)
 * Cylinder -> Bent Tube
 */
function lessonBend(canvasSize = 32, color = '#e91e63') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.1);
  const length = Math.floor(canvasSize * 0.35);

  // Original straight tube (ghost, pointing right)
  commands.push(shapes.drawLine(cx, cy - r, cx + length * 2, cy - r, '#bdbdbd'));
  commands.push(shapes.drawLine(cx, cy + r, cx + length * 2, cy + r, '#bdbdbd'));
  
  // Bent tube
  commands.push(...transformShapes.drawBentTube(cx, cy + length, r, length, color));

  return commands;
}

module.exports = {
  lessonStretch,
  lessonSquash,
  lessonTaperSwell,
  lessonBend
};
