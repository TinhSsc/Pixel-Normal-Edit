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
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const workflow = require('../rules/workflow');
      workflow.setStepFlag(session, 'canvas_initialized', true);
      return { action: 'resize', ...p };
    });

  registerTool(server, 'canvas_clear',
    'Erase all pixels on the current canvas frame',
    {},
    () => ({ action: 'clear' }));

  registerTool(server, 'canvas_trim',
    'Auto-trim transparent borders from canvas',
    {},
    () => ({ action: 'trim' }));
  registerTool(server, 'region_clear',
    'Erase a specific rectangular region of pixels. Use this for local repairs instead of canvas_clear.',
    {
      x: z.number().int().describe('Top-left X coordinate'),
      y: z.number().int().describe('Top-left Y coordinate'),
      w: z.number().int().min(1).describe('Width of the region to clear'),
      h: z.number().int().min(1).describe('Height of the region to clear'),
      explicitReset: z.boolean().default(false).describe('Must be true if clearing > 25% of the canvas area'),
      explicitResetReason: z.string().optional().describe('Required if explicitReset is true')
    },
    (p) => ({ action: 'clearRegion', ...p }));
}

module.exports = { register };