#!/usr/bin/env node

const sunShapes = require('./sun-shapes');
const sunsetColors = require('./sunset-colors');
const sunsetSky = require('./sunset-sky');

module.exports = {
  ...sunShapes,
  ...sunsetColors,
  ...sunsetSky,
};
