#!/usr/bin/env node
/**
 * tools/index.js — Tool registry aggregator
 *
 * Imports and registers all core drawing/utility tools on an MCP server instance.
 * To add a new tool category, create a new file in this folder and add it here.
 *
 * File naming convention: {category}-tools.js
 *   - canvas-tools.js     → Canvas operations
 *   - workspace-tools.js  → Tab/workspace management
 *   - animation-tools.js  → Animation frames
 *   - drawing-tools.js    → Drawing primitives
 *   - sprite-tools.js     → Sprite/stamp system
 *   - region-tools.js     → Region clipboard
 *   - filter-tools.js     → Visual filters
 *   - anchor-tools.js     → Coordinate anchors
 *   - query-tools.js      → Query & visual feedback
 *   - history-tools.js    → Undo/redo
 *   - mode-tools.js       → Mode settings
 *   - color-tools.js      → Color management
 *   - health-tools.js     → Health check
 *   - layer-tools.js      → Layer management
 */
const canvas = require('./canvas-tools');
const workspace = require('./workspace-tools');
const animation = require('./animation-tools');
const drawing = require('./drawing-tools');
const sprite = require('./sprite-tools');
const region = require('./region-tools');
const filters = require('./filter-tools');
const anchors = require('./anchor-tools');
const query = require('./query-tools');
const history = require('./history-tools');
const modes = require('./mode-tools');
const colors = require('./color-tools');
const health = require('./health-tools');
const layer = require('./layer-tools');

/**
 * Register all core tools on the given MCP server instance.
 * @param {McpServer} server
 */
function registerAll(server) {
  canvas.register(server);
  workspace.register(server);
  animation.register(server);
  drawing.register(server);
  sprite.register(server);
  region.register(server);
  filters.register(server);
  anchors.register(server);
  query.register(server);
  history.register(server);
  modes.register(server);
  colors.register(server);
  health.register(server);
  layer.register(server);
}

module.exports = { registerAll };