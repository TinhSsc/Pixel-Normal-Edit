#!/usr/bin/env node
/**
 * anchor-tools.js — Coordinate Anchor tools
 *
 * Tools: anchor_set, anchor_get, anchor_list
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'anchor_set',
    'Set a named coordinate anchor for relative drawing. E.g. anchor "head" at (20,5) then draw relative to it.',
    { name: z.string().describe('Anchor name'), x: z.number().int(), y: z.number().int() },
    (p) => ({ action: 'setAnchor', ...p }));

  registerTool(server, 'anchor_get',
    'Get position of a named anchor',
    { name: z.string() },
    (p) => ({ action: 'getAnchor', name: p.name }));

  registerTool(server, 'anchor_list',
    'List all named anchors',
    {},
    () => ({ action: 'listAnchors' }));
}

module.exports = { register };