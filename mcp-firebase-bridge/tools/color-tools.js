#!/usr/bin/env node
/**
 * color-tools.js — Color tools
 *
 * Tools: color_set, color_get
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

function register(server) {
  registerTool(server, 'color_set',
    'Set the primary and/or secondary color',
    { primary: hexColor.optional(), secondary: hexColor.optional() },
    (p) => ({ action: 'setColor', ...p }));

  registerTool(server, 'color_get',
    'Get current primary and secondary colors',
    {},
    () => ({ action: 'getColor' }));
}

module.exports = { register };