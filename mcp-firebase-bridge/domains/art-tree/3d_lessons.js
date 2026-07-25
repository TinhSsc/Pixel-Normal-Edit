const shapes3d = require('./3d_shapes');
const advShapes = require('./advanced_shapes');

/**
 * Lesson: Box Properties (Width, Height, Depth, Planes, Edges)
 */
function lessonBoxProperties(canvasSize = 32, color = '#2196f3') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.4);
  const h = Math.floor(canvasSize * 0.4);
  const d = Math.floor(canvasSize * 0.3);

  // Draw wireframe box
  commands.push(...shapes3d.drawWireframeBox(cx, cy, w, h, d, color));
  
  // Highlight dimensions
  const fX = cx - Math.floor(w/2);
  const fY = cy - Math.floor(h/2);
  
  // Width
  commands.push(...advShapes.drawDistance(fX, fY + h + 2, fX + w, fY + h + 2, '#4caf50'));
  // Height
  commands.push(...advShapes.drawDistance(fX - 2, fY, fX - 2, fY + h, '#ff9800'));
  
  // Depth (approximate along the oblique edge)
  const dx = Math.floor(d * 0.7);
  const dy = Math.floor(d * 0.5);
  commands.push(...advShapes.drawDistance(fX + w + 2, fY + h, fX + w + 2 + dx, fY + h - dy, '#e91e63'));

  return commands;
}

/**
 * Lesson: Sphere Properties (Center, Radius, Cross contours, Axis)
 */
function lessonSphereProperties(canvasSize = 32, color = '#9c27b0') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);

  // Draw sphere with volume lines
  commands.push(...shapes3d.drawSphereVolume(cx, cy, r, color));
  
  // Highlight radius
  commands.push(...advShapes.drawDistance(cx, cy, cx + r, cy, '#ff9800'));

  return commands;
}

/**
 * Lesson: Cylinder Properties (Central axis, Bases, Perspective change)
 */
function lessonCylinderProperties(canvasSize = 32, color = '#00bcd4') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.3);
  const h = Math.floor(canvasSize * 0.6);

  // Draw cylinder volume
  commands.push(...shapes3d.drawCylinderVolume(cx, cy, r, h, color));
  
  // Highlight Height
  commands.push(...advShapes.drawDistance(cx + r + 4, cy - Math.floor(h/2), cx + r + 4, cy + Math.floor(h/2), '#4caf50'));

  // Highlight Radius (top base)
  commands.push(...advShapes.drawDistance(cx, cy - Math.floor(h/2), cx + r, cy - Math.floor(h/2), '#ff9800'));

  return commands;
}

/**
 * Lesson: Cone Properties (Apex, Base, Axis)
 */
function lessonConeProperties(canvasSize = 32, color = '#ff5722') {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);
  const h = Math.floor(canvasSize * 0.6);

  // Draw cone volume
  commands.push(...shapes3d.drawConeVolume(cx, cy, r, h, color));
  
  // Highlight Height
  const apexY = cy - Math.floor(h/2);
  const baseY = cy + Math.floor(h/2);
  commands.push(...advShapes.drawDistance(cx + r + 4, apexY, cx + r + 4, baseY, '#4caf50'));
  
  // Highlight Radius (base)
  commands.push(...advShapes.drawDistance(cx, baseY, cx + r, baseY, '#ff9800'));

  return commands;
}

function get3DLessonCatalog() {
  return [
    { id: '3d_box', name: '3D Box Properties', description: 'Width, height, depth, planes, inner structure', fn: lessonBoxProperties },
    { id: '3d_sphere', name: '3D Sphere Properties', description: 'Center, radius, axis, cross contours', fn: lessonSphereProperties },
    { id: '3d_cylinder', name: '3D Cylinder Properties', description: 'Axis, bases, height, perspective changes', fn: lessonCylinderProperties },
    { id: '3d_cone', name: '3D Cone Properties', description: 'Apex, base, axis, radius', fn: lessonConeProperties },
  ];
}

module.exports = {
  lessonBoxProperties,
  lessonSphereProperties,
  lessonCylinderProperties,
  lessonConeProperties,
  get3DLessonCatalog
};
