#!/usr/bin/env node

const hiddenBox = require('./hidden-box');
const hiddenCup = require('./hidden-cup');
const hiddenHead = require('./hidden-head');

module.exports = {
  ...hiddenBox,
  ...hiddenCup,
  ...hiddenHead,
};
