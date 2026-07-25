#!/usr/bin/env node
/**
 * animation-tools.js — Animation Frame tools
 *
 * Tools: animation_enable, animation_add_frame, animation_go_to_frame,
 *        animation_ensure_frame, animation_get_info, animation_remove_frame,
 *        animation_reorder_frame, animation_compare_frames
 */
const { z } = require('zod');
const { registerTool, sendCommand } = require('../core/server');

function register(server) {
  registerTool(server, 'animation_enable',
    'Enable or disable animation mode. When enabled, the canvas has multiple frames.',
    { enabled: z.boolean().describe('true to enable, false to disable') },
    (p) => ({ action: 'setAnimationMode', enabled: p.enabled }));

  registerTool(server, 'animation_add_frame',
    'Append a new blank frame to the animation',
    {},
    () => ({ action: 'addFrame' }));

  registerTool(server, 'animation_go_to_frame',
    'Switch to editing a specific frame by index (0-based)',
    { index: z.number().int().min(0).describe('Frame index') },
    (p) => ({ action: 'goToFrame', index: p.index }));

  registerTool(server, 'animation_ensure_frame',
    'Make sure the animation has at least (index+1) frames, then switch to that frame',
    { index: z.number().int().min(0).describe('Target frame index') },
    (p) => ({ action: 'ensureFrame', index: p.index }));

  registerTool(server, 'animation_get_info',
    'Get current frame count and active frame index',
    {},
    async () => {
      const [count, idx] = await Promise.all([
        sendCommand({ action: 'getFrameCount' }),
        sendCommand({ action: 'getActiveFrameIndex' }),
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ frameCount: count, activeIndex: idx }) }] };
    });

  registerTool(server, 'animation_remove_frame',
    'Remove frame at the given index',
    { index: z.number().int().min(0) },
    (p) => ({ action: 'removeFrame', index: p.index }));

  registerTool(server, 'animation_reorder_frame',
    'Move a frame from one position to another',
    { from: z.number().int().min(0), to: z.number().int().min(0) },
    (p) => ({ action: 'reorderFrame', from: p.from, to: p.to }));

  registerTool(server, 'animation_compare_frames',
    'Get list of pixel differences between two frames',
    { frameIndex1: z.number().int().min(0), frameIndex2: z.number().int().min(0) },
    (p) => ({ action: 'getFrameDifferences', ...p }));
}

module.exports = { register };