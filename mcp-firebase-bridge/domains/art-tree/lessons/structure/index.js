#!/usr/bin/env node

const axisOrientation = require('./axis-orientation');
const complexStructure = require('./complex-structure');
const xYzaxes = require('./x-yzaxes');

module.exports = {
  ...axisOrientation,
  ...complexStructure,
  ...xYzaxes,
};
