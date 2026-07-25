#!/usr/bin/env node
/**
 * sprite-tools.js — Sprite / Stamp System tools
 *
 * Tools: sprite_draw, sprite_save_stamp, sprite_use_stamp, sprite_list_stamps
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'sprite_draw',
    `Draw a sprite using ASCII art + color palette. Each character in the data array maps to a color.
EXAMPLE:
  palette: { "H": "#ffcc99", "B": "#1565c0", ".": null }
  data:    [ "..H..", ".BBB.", "..H.." ]
This is the most efficient way to draw complex shapes — replaces dozens of drawPixel calls.`,
    {
      x: z.number().int().default(0).describe('Top-left X offset'),
      y: z.number().int().default(0).describe('Top-left Y offset'),
      palette: z.record(z.string().length(1), z.string().nullable()).describe('Char→hex map. null = transparent/skip'),
      data: z.array(z.string()).min(1).describe('Rows of ASCII art characters')
    },
    (p) => ({ action: 'drawSprite', ...p }));

  registerTool(server, 'sprite_save_stamp',
    'Save a named sprite for reuse across frames. Use sprite_use_stamp to place it.',
    { name: z.string().describe('Unique stamp name'), palette: z.record(z.string().length(1), z.string().nullable()),
      data: z.array(z.string()).min(1) },
    (p) => ({ action: 'saveStamp', ...p }));

  registerTool(server, 'sprite_use_stamp',
    'Place a previously saved stamp at a position. Optionally override palette colors.',
    { name: z.string().describe('Stamp name (from sprite_save_stamp)'), x: z.number().int().default(0),
      y: z.number().int().default(0), palette: z.record(z.string().length(1), z.string().nullable()).optional().describe('Override specific palette colors') },
    (p) => ({ action: 'useStamp', ...p }));

  registerTool(server, 'sprite_list_stamps',
    'List all saved stamp names',
    {},
    () => ({ action: 'listStamps' }));
}

module.exports = { register };