#!/usr/bin/env node
/**
 * lessons/index.js — Art Tree: Lessons Index
 *
 * Exports all lesson functions and catalog getters organized by category.
 */

const basic = require('./basic');
const advanced = require('./advanced');
const curves = require('./curves');
const ellipses = require('./ellipses');
const forms3d = require('./3d');
const structure = require('./structure');
const crossSections = require('./cross-sections');
const transforms = require('./transforms');
const surfaces = require('./surfaces');
const perspective = require('./perspective');
const hidden = require('./hidden');
const lighting = require('./lighting');
const materials = require('./materials');
const analysis = require('./analysis');
const layers = require('./layers');
const sky = require('./sky');

module.exports = {
  ...basic,
  ...advanced,
  ...curves,
  ...ellipses,
  ...forms3d,
  ...structure,
  ...crossSections,
  ...transforms,
  ...surfaces,
  ...perspective,
  ...hidden,
  ...lighting,
  ...materials,
  ...analysis,
  ...layers,
  ...sky,
};
