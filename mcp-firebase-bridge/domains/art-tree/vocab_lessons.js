const vocabShapes = require('./vocab_shapes');

/**
 * Lesson: Visual Vocabulary - House Breakdown
 * A 5-step process of recalling and drawing parts of an object.
 * Users can supply the step number (1 to 5) to see the progressive breakdown.
 */
function lessonVocabHouse(canvasSize = 64, step = 1) {
  const cx = Math.floor(canvasSize / 2);
  const cy = Math.floor(canvasSize * 0.45);
  
  // Ensure step is between 1 and 5
  const validStep = Math.max(1, Math.min(5, step));

  return vocabShapes.drawHouseBreakdown(cx, cy, canvasSize, validStep);
}

function getVocabLessonCatalog() {
  return [
    { 
      id: 'vocab_house', 
      name: 'House Breakdown (5 Steps)', 
      description: 'Break down a house: Masses -> Structural -> Functional -> Identity -> Materials. Supply step=1..5', 
      fn: lessonVocabHouse 
    }
  ];
}

module.exports = {
  lessonVocabHouse,
  getVocabLessonCatalog
};
