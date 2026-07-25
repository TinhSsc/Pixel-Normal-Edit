#!/usr/bin/env node

const onePointPerspective = require('./1point-perspective');
const twoPointPerspective = require('./2point-perspective');
const threePointPerspective = require('./3point-perspective');
const foreshortening = require('./foreshortening');

module.exports = {
  ...onePointPerspective,
  ...twoPointPerspective,
  ...threePointPerspective,
  ...foreshortening,
};
