const materialShapes = require('./material_shapes');

/**
 * Lesson: Shiny vs Matte (Metal vs Plastic/Rubber)
 * Compares high contrast sharp highlights vs low contrast diffused highlights.
 */
function lessonMaterialShiny(canvasSize = 32) {
  const commands = [];
  const cx1 = Math.floor(canvasSize * 0.3);
  const cx2 = Math.floor(canvasSize * 0.7);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);

  // 1. Metal Sphere (Left)
  commands.push(...materialShapes.drawMetalSphere(cx1, cy, r));

  // 2. Matte/Plastic Sphere (Right)
  commands.push(...materialShapes.drawMatteSphere(cx2, cy, r, '#e65100'));

  return commands;
}

/**
 * Lesson: Transparent (Glass)
 * Demonstrates Fresnel effect, sharp reflections, and light transmission.
 */
function lessonMaterialGlass(canvasSize = 32) {
  const commands = [];
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.35);

  commands.push(...materialShapes.drawGlassSphere(cx, cy, r));

  return commands;
}

/**
 * Lesson: Texture (Wood vs Stone)
 * Compares organic lines vs rough cracks.
 */
function lessonMaterialTexture(canvasSize = 32) {
  const commands = [];
  const cx1 = Math.floor(canvasSize * 0.3);
  const cx2 = Math.floor(canvasSize * 0.7);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.2);

  // 1. Wood Sphere (Left)
  commands.push(...materialShapes.drawTexturedSphere(cx1, cy, r, 'wood'));

  // 2. Stone Sphere (Right)
  commands.push(...materialShapes.drawTexturedSphere(cx2, cy, r, 'stone'));

  return commands;
}

function getMaterialLessonCatalog() {
  return [
    { id: 'material_shiny', name: 'Metal vs Matte', description: 'Sharp highlights (Metal) vs Soft highlights (Plastic)', fn: lessonMaterialShiny },
    { id: 'material_glass', name: 'Glass & Transparency', description: 'Fresnel effect and transmitted light', fn: lessonMaterialGlass },
    { id: 'material_texture', name: 'Texture: Wood vs Stone', description: 'Grain lines vs cracks on a 3D form', fn: lessonMaterialTexture },
  ];
}

module.exports = {
  lessonMaterialShiny,
  lessonMaterialGlass,
  lessonMaterialTexture,
  getMaterialLessonCatalog
};
