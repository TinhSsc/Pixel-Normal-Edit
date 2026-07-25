#!/usr/bin/env node
/**
 * mode-tools.js — Mode settings tools
 *
 * Tools: mode_set_mirror, mode_set_onion_skin, mode_set_grid
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'mode_set_mirror',
    'Enable/disable mirror drawing mode (symmetric left-right)',
    { enabled: z.boolean() },
    (p) => ({ action: 'setMirror', enabled: p.enabled }));

  registerTool(server, 'mode_set_onion_skin',
    'Enable/disable onion skin (shows previous frame as ghost)',
    { enabled: z.boolean() },
    (p) => ({ action: 'setOnionSkin', enabled: p.enabled }));

  registerTool(server, 'mode_set_grid',
    'Show/hide the pixel grid overlay',
    { enabled: z.boolean() },
    (p) => ({ action: 'setGrid', enabled: p.enabled }));
}

module.exports = { register };