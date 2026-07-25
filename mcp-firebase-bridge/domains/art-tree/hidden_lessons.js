const hiddenShapes = require('./hidden_shapes');

/**
 * Lesson: Hidden Box (6-sided box)
 * You see 3 faces, but you must understand all 6.
 */
function lessonHiddenBox(canvasSize = 32, visibleColor = '#2196f3', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const w = Math.floor(canvasSize * 0.4);
  const h = Math.floor(canvasSize * 0.4);
  const d = Math.floor(canvasSize * 0.4);

  return hiddenShapes.drawXRayBox(cx, cy, w, h, d, visibleColor, hiddenColor);
}

/**
 * Lesson: Hidden Head (Human head and skull)
 * You don't see the whole skull, but must understand the structure behind it.
 */
function lessonHiddenHead(canvasSize = 32, visibleColor = '#ff5722', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize * 0.4);
  const r = Math.floor(canvasSize * 0.25);

  return hiddenShapes.drawXRayHead(cx, cy, r, visibleColor, hiddenColor);
}

/**
 * Lesson: Hidden Cup (Cup and inner bottom)
 * You don't see the full inside bottom, but must understand how the wall goes down.
 */
function lessonHiddenCup(canvasSize = 32, visibleColor = '#4caf50', hiddenColor = '#e0e0e0') {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize / 2);
  const r = Math.floor(canvasSize * 0.25);
  const h = Math.floor(canvasSize * 0.5);

  return hiddenShapes.drawXRayCup(cx, cy, r, h, visibleColor, hiddenColor);
}

function getHiddenLessonCatalog() {
  return [
    { id: 'hidden_box', name: 'Hidden Box', description: 'See all 6 faces of a box, not just 3', fn: lessonHiddenBox },
    { id: 'hidden_head', name: 'Hidden Head', description: 'Understand the cranium sphere behind the face', fn: lessonHiddenHead },
    { id: 'hidden_cup', name: 'Hidden Cup', description: 'Understand the inner depth and bottom of a cup', fn: lessonHiddenCup },
  ];
}

module.exports = {
  lessonHiddenBox,
  lessonHiddenHead,
  lessonHiddenCup,
  getHiddenLessonCatalog
};
