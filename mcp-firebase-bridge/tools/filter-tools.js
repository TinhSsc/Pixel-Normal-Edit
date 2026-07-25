#!/usr/bin/env node
/**
 * filter-tools.js — Visual Filter tools
 *
 * Tools: filter_apply
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'filter_apply',
    `Apply a visual filter to the canvas (or a region).
Types: brightness (value: -255 to 255), invert, grayscale, hue-rotate (value: degrees 0-360)`,
    { type: z.enum(['brightness', 'invert', 'grayscale', 'hue-rotate']),
      value: z.number().optional().describe('Parameter: brightness=-255..255, hue-rotate=0..360'),
      x: z.number().int().optional(), y: z.number().int().optional(),
      w: z.number().int().optional(), h: z.number().int().optional() },
    (p) => ({ action: 'applyFilter', ...p }));
}

module.exports = { register };