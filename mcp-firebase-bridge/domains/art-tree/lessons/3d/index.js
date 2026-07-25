#!/usr/bin/env node

const boxProperties = require('./box-properties');
const coneProperties = require('./cone-properties');
const cylinderProperties = require('./cylinder-properties');
const sphereProperties = require('./sphere-properties');

module.exports = {
  ...boxProperties,
  ...coneProperties,
  ...cylinderProperties,
  ...sphereProperties,
};
