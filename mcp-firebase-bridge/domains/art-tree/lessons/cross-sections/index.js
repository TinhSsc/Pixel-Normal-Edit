#!/usr/bin/env node

const bottleSections = require('./bottle-sections');
const glassSections = require('./glass-sections');
const headSections = require('./head-sections');

module.exports = {
  ...bottleSections,
  ...glassSections,
  ...headSections,
};
