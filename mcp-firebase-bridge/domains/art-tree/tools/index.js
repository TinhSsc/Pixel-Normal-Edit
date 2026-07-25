#!/usr/bin/env node
/**
 * tools/index.js — Art Tree: MCP Tools Index
 *
 * Main entry point for registering all Art Tree MCP tools.
 * Imports and registers all tool categories.
 */

const basic = require('./basic');
const advanced = require('./advanced');
const curves = require('./curves');
const ellipses = require('./ellipses');
const forms3d = require('./3d');
const structure = require('./structure');
const crossSections = require('./cross-sections');
const transforms = require('./transforms');
const surfaces = require('./surfaces');
const perspective = require('./perspective');
const hidden = require('./hidden');
const lighting = require('./lighting');
const materials = require('./materials');
const analysis = require('./analysis');
const layers = require('./layers');
const sky = require('./sky');

/**
 * Register all Art Tree MCP tools on the server
 * @param {McpServer} server
 */
function registerAll(server) {
  basic.register(server);
  advanced.register(server);
  curves.register(server);
  ellipses.register(server);
  forms3d.register(server);
  structure.register(server);
  crossSections.register(server);
  transforms.register(server);
  surfaces.register(server);
  perspective.register(server);
  hidden.register(server);
  lighting.register(server);
  materials.register(server);
  analysis.register(server);
  layers.register(server);
  sky.register(server);
}

module.exports = {
  registerAll,
};