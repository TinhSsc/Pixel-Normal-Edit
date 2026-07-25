#!/usr/bin/env node
/**
 * history-tools.js — History (Undo/Redo) tools
 *
 * Tools: history_undo, history_redo
 */
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'history_undo',
    'Undo the last drawing action',
    {},
    () => ({ action: 'undo' }));

  registerTool(server, 'history_redo',
    'Redo the last undone action',
    {},
    () => ({ action: 'redo' }));
}

module.exports = { register };