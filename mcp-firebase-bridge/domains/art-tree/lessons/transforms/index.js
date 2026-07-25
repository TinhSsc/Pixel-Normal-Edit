#!/usr/bin/env node

const bend = require('./bend');
const combine = require('./combine');
const cut = require('./cut');
const hollow = require('./hollow');
const rotate = require('./rotate');
const squash = require('./squash');
const stretch = require('./stretch');
const taperSwell = require('./taper-swell');

module.exports = {
  ...bend,
  ...combine,
  ...cut,
  ...hollow,
  ...rotate,
  ...squash,
  ...stretch,
  ...taperSwell,
};
