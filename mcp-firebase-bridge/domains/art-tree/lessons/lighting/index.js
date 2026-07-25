#!/usr/bin/env node

const contactShadow = require('./contact-shadow');
const lightDirection = require('./light-direction');
const lightZones = require('./light-zones');

module.exports = {
  ...contactShadow,
  ...lightDirection,
  ...lightZones,
};
