#!/usr/bin/env node
/**
 * health-tools.js — Health Check / Ping tools
 *
 * Tools: ping
 */
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'ping',
    'Check if the browser editor is connected and responding',
    {},
    () => ({ action: 'ping' }));
}

module.exports = { register };