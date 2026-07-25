/**
 * Auto-extracted from layer_lessons.js
 */
const shapes = require('../../shapes');

/**
 * Lesson: Layer Structure (Tư duy Layer)
 * A 7-step progression showing what belongs on each layer.
 * Users can supply the layer index (1 to 7) to see a specific layer's content.
 */
function lessonLayerStep(canvasSize = 32, layerIndex = 1) {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  
  // Ensure layerIndex is between 1 and 7
  const validLayer = Math.max(1, Math.min(7, layerIndex));

  return layerShapes.drawLayeredCup(cx, cy, canvasSize, validLayer);
}

module.exports = { lessonLayerStep };
