#!/usr/bin/env node
/**
 * region-tools.js — Region Clipboard tools
 *
 * Tools: region_copy, region_paste
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'region_copy',
    'Copy a rectangular region of pixels to an internal clipboard',
    { x: z.number().int().default(0), y: z.number().int().default(0),
      w: z.number().int().min(1).describe('Width of region'), h: z.number().int().min(1).describe('Height of region') },
    (p) => ({ action: 'copyRegion', ...p }));

  registerTool(server, 'region_paste',
    'Paste the clipboard region at (x,y). Defaults to original position.',
    { x: z.number().int().optional().describe('X destination (default: original X)'),
      y: z.number().int().optional().describe('Y destination (default: original Y)') },
    (p) => ({ action: 'pasteRegion', ...p }));
}

module.exports = { register };