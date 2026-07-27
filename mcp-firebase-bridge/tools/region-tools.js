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

  registerTool(server, 'edit_capture_before',
    'Capture a snapshot of the region BEFORE an edit. Used to validate diffs later.',
    { affectedRegion: z.object({ x: z.number().int(), y: z.number().int(), w: z.number().int(), h: z.number().int() }) },
    (p) => ({ action: 'editCaptureBefore', ...p }));

  registerTool(server, 'edit_validate_diff',
    'Compare current state against the captured BEFORE state to ensure NO pixels outside affectedRegion were changed.',
    {},
    () => ({ action: 'editValidateDiff' }));
}

module.exports = { register };