#!/usr/bin/env node
/**
 * domains/art-tree/index.js — Art Tree Module Aggregator
 *
 * Aggregates and exports all Art Tree module components.
 * To add new features to this module, create a new file and add it here.
 *
 * Module namespace: art_tree_* (all tools prefixed with art_tree_)
 */
const shapes = require('./shapes');
const lessons = require('./lessons');
const tools = require('./tools');
const advTools = require('./advanced_tools');
const curveTools = require('./curve_tools');
const ellipseTools = require('./ellipse_tools');
const tools3d = require('./3d_tools');
const structureTools = require('./structure_tools');
const csTools = require('./cross_section_tools');
const transformTools = require('./transform_tools');
const surfaceTools = require('./surface_tools');
const perspTools = require('./perspective_tools');
const hiddenTools = require('./hidden_tools');
const lightTools = require('./light_tools');
const materialTools = require('./material_tools');
const analysisTools = require('./analysis_tools');
const layerTools = require('./layer_tools');
const skyTools = require('./sky_tools');
const vocabTools = require('./vocab_tools');

/**
 * Register all Art Tree MCP tools on the server
 * @param {McpServer} server
 */
function registerAll(server) {
  tools.register(server);
  advTools.register(server);
  curveTools.register(server);
  ellipseTools.register(server);
  tools3d.register(server);
  structureTools.register(server);
  csTools.register(server);
  transformTools.register(server);
  surfaceTools.register(server);
  perspTools.register(server);
  hiddenTools.register(server);
  lightTools.register(server);
  materialTools.register(server);
  analysisTools.register(server);
  layerTools.register(server);
  skyTools.register(server);
  vocabTools.register(server);
}

module.exports = {
  shapes,
  lessons,
  tools,
  registerAll,
};