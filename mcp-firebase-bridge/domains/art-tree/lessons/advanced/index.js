#!/usr/bin/env node

const angles = require('./angles');
const distances = require('./distances');
const shapeRatios = require('./shape-ratios');
const shapeRelationships = require('./shape-relationships');
const symmetryAndAxis = require('./symmetry-and-axis');

module.exports = {
  ...angles,
  ...distances,
  ...shapeRatios,
  ...shapeRelationships,
  ...symmetryAndAxis,
};
