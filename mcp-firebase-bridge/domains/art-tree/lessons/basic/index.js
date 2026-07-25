#!/usr/bin/env node

const circles = require('./circles');
const composition = require('./composition');
const curves = require('./curves');
const ellipses = require('./ellipses');
const freehand = require('./freehand');
const lines = require('./lines');
const parallelAndIntersecting = require('./parallel-and-intersecting');
const polygons = require('./polygons');
const proportionsAndAngles = require('./proportions-and-angles');
const spiral = require('./spiral');
const squares = require('./squares');
const strokes = require('./strokes');
const triangles = require('./triangles');

module.exports = {
  ...circles,
  ...composition,
  ...curves,
  ...ellipses,
  ...freehand,
  ...lines,
  ...parallelAndIntersecting,
  ...polygons,
  ...proportionsAndAngles,
  ...spiral,
  ...squares,
  ...strokes,
  ...triangles,
};
