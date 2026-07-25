#!/usr/bin/env node
/**
 * query-tools.js — Query & Visual Feedback tools
 *
 * Tools: query_snapshot, query_bounding_box, query_palette, query_pixel,
 *        query_export_image, query_document_state
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'query_snapshot',
    `Get an ASCII art representation of the current canvas frame. Use this to "see" what you've drawn before continuing.
Returns: { ascii, legend, width, height } where each symbol in ascii maps to a hex color via legend.
Increase scale to get a smaller grid (scale=2 means 1 char = 2×2 pixels).`,
    { scale: z.number().int().min(1).max(8).default(1).describe('Downscale factor (1=full resolution)'),
      maxColors: z.number().int().min(2).max(32).default(12).describe('Max distinct colors in legend') },
    (p) => ({ action: 'querySnapshot', ...p }));

  registerTool(server, 'query_bounding_box',
    'Get the bounding box of all non-transparent pixels {minX, minY, maxX, maxY, width, height}',
    {},
    () => ({ action: 'query', type: 'getBoundingBox' }));

  registerTool(server, 'query_palette',
    'Get list of all distinct colors used on the canvas',
    {},
    () => ({ action: 'query', type: 'getPalette' }));

  registerTool(server, 'query_pixel',
    'Get the color of a specific pixel. Returns hex string or null if transparent.',
    { x: z.number().int(), y: z.number().int() },
    (p) => ({ action: 'getPixel', x: p.x, y: p.y }));

  registerTool(server, 'query_export_image',
    `Export the current frame as a base64 PNG data URL.
Use this to visually verify your work — paste the dataUrl into an image viewer.
The dataUrl starts with "data:image/png;base64,..."`,
    { format: z.enum(['png', 'webp', 'jpeg']).default('png') },
    (p) => ({ action: 'exportBase64', format: p.format }));

  registerTool(server, 'query_document_state',
    'Get full document state: tab name, canvas size, animation info, undo availability',
    {},
    () => ({ action: 'query', type: 'getDocumentState' }));
}

module.exports = { register };