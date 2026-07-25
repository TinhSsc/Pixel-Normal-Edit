#!/usr/bin/env node

const coaxialEllipses = require('./coaxial-ellipses');
const ellipseAnatomy = require('./ellipse-anatomy');
const ellipseOrientations = require('./ellipse-orientations');
const ellipseProportions = require('./ellipse-proportions');

module.exports = {
  ...coaxialEllipses,
  ...ellipseAnatomy,
  ...ellipseOrientations,
  ...ellipseProportions,
};
