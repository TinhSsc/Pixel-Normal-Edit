#!/usr/bin/env node

const chairAnalysis = require('./chair-analysis');
const cupAnalysis = require('./cup-analysis');
const edgeTypes = require('./edge-types');
const surfaceTypes = require('./surface-types');

module.exports = {
  ...chairAnalysis,
  ...cupAnalysis,
  ...edgeTypes,
  ...surfaceTypes,
};
