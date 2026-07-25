#!/usr/bin/env node
/**
 * canvas-tools.js — Canvas & Setup tools
 *
 * Tools: canvas_get_size, canvas_resize, canvas_clear, canvas_trim
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'canvas_get_size',
    'Get current canvas dimensions {width, height}',
    {},
    () => ({ action: 'getSize' }));

  registerTool(server, 'canvas_resize',
    'Resize canvas to new dimensions. mode=clear resets pixels, extend keeps them.',
    {
      width: z.number().int().min(1).max(256).describe('New width in pixels (max 256)'),
      height: z.number().int().min(1).max(256).describe('New height in pixels (max 256)'),
      mode: z.enum(['clear', 'extend', 'fit']).default('clear').describe('How to handle existing content'),
      dx: z.number().int().default(0).describe('X offset for content when extending'),
      dy: z.number().int().default(0).describe('Y offset for content when extending')
    },
    (p) => ({ action: 'resize', ...p }));

  registerTool(server, 'canvas_clear',
    'Erase all pixels on the current canvas frame',
    {},
    () => ({ action: 'clear' }));

  registerTool(server, 'canvas_trim',
    'Auto-trim transparent borders from canvas',
    {},
    () => ({ action: 'trim' }));
}

module.exports = { register };