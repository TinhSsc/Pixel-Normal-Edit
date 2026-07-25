#!/usr/bin/env node

const materialGlass = require('./material-glass');
const materialShiny = require('./material-shiny');
const materialTexture = require('./material-texture');

module.exports = {
  ...materialGlass,
  ...materialShiny,
  ...materialTexture,
};
