#!/usr/bin/env node
/**
 * drawing-tools.js — Drawing Primitives tools
 *
 * Tools: draw_pixel, draw_erase, draw_line, draw_rect, draw_circle,
 *        draw_ellipse, draw_polygon, draw_fill, draw_gradient_rect,
 *        bulk_replace_color, bulk_flood_fill_all
 */
const { z } = require('zod');
const { registerTool } = require('../core/server');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

function register(server) {
  registerTool(server, 'draw_pixel',
    'Set a single pixel to a color',
    { x: z.number().int().max(1024).describe('X coordinate'), y: z.number().int().max(1024).describe('Y coordinate'), color: hexColor },
    (p) => ({ action: 'drawPixel', ...p }));

  registerTool(server, 'draw_erase',
    'Erase a single pixel (make transparent)',
    { x: z.number().int().max(1024), y: z.number().int().max(1024) },
    (p) => ({ action: 'erasePixel', ...p }));

  registerTool(server, 'draw_pixels_bulk',
    'Set multiple pixels at once (much faster than calling draw_pixel repeatedly)',
    { 
      pixels: z.array(z.object({ 
        x: z.number().int().max(1024), 
        y: z.number().int().max(1024), 
        color: hexColor.optional() 
      })).max(5000).describe('Array of pixels {x, y, color}. Omit color to erase.')
    },
    (p) => ({ action: 'drawPixelsBulk', pixels: p.pixels }));

  registerTool(server, 'draw_line',
    'Draw a straight line using Bresenham algorithm',
    { x0: z.number().int().max(1024), y0: z.number().int().max(1024), x1: z.number().int().max(1024), y1: z.number().int().max(1024), color: hexColor },
    (p) => ({ action: 'drawLine', ...p }));

  registerTool(server, 'draw_rect',
    'Draw a rectangle (outline or filled)',
    {
      x: z.number().int().max(1024).describe('Top-left X'), y: z.number().int().max(1024).describe('Top-left Y'),
      w: z.number().int().min(1).max(256).describe('Width (max 256)'), h: z.number().int().min(1).max(256).describe('Height (max 256)'),
      color: hexColor, filled: z.boolean().default(false).describe('Fill interior?')
    },
    (p) => ({ action: 'drawRect', ...p }));

  registerTool(server, 'draw_circle',
    'Draw a circle (outline or filled)',
    { cx: z.number().int().max(1024).describe('Center X'), cy: z.number().int().max(1024).describe('Center Y'),
      r: z.number().int().min(1).max(128).describe('Radius (max 128)'), color: hexColor, filled: z.boolean().default(false) },
    (p) => ({ action: 'drawCircle', ...p }));

  registerTool(server, 'draw_ellipse',
    'Draw an ellipse (outline or filled)',
    { cx: z.number().int().max(1024), cy: z.number().int().max(1024), rx: z.number().int().min(1).max(128).describe('Horizontal radius'),
      ry: z.number().int().min(1).max(128).describe('Vertical radius'), color: hexColor, filled: z.boolean().default(false) },
    (p) => ({ action: 'drawEllipse', ...p }));

  registerTool(server, 'draw_polygon',
    'Draw a polygon from a list of points (outline or filled)',
    { points: z.array(z.object({ x: z.number().int().max(1024), y: z.number().int().max(1024) })).min(3).describe('Array of {x,y} vertices'),
      color: hexColor, filled: z.boolean().default(false) },
    (p) => ({ action: 'drawPolygon', ...p }));

  registerTool(server, 'draw_fill',
    'Flood-fill starting from (x,y) with a color',
    { x: z.number().int().max(1024), y: z.number().int().max(1024), color: hexColor },
    (p) => ({ action: 'fill', ...p }));

  registerTool(server, 'draw_gradient_rect',
    'Draw a rectangle filled with a smooth gradient',
    { x: z.number().int().max(1024), y: z.number().int().max(1024), w: z.number().int().min(1).max(256).describe('Width (max 256)'), h: z.number().int().min(1).max(256).describe('Height (max 256)'),
      colorFrom: hexColor.describe('Start color'), colorTo: hexColor.describe('End color'),
      direction: z.enum(['h', 'v']).default('h').describe('h=horizontal, v=vertical') },
    (p) => ({ action: 'drawGradientRect', ...p }));

  registerTool(server, 'bulk_replace_color',
    'Replace ALL pixels of one color with another across the entire canvas',
    { from: hexColor.describe('Color to replace'), to: hexColor.describe('New color') },
    (p) => ({ action: 'replaceColor', from: p.from, to: p.to }));

  registerTool(server, 'bulk_flood_fill_all',
    'Flood-fill every disconnected region of a given color',
    { color: hexColor.describe('Color to replace'), to: hexColor.describe('Replacement color') },
    (p) => ({ action: 'floodFillAll', color: p.color, to: p.to }));
}

module.exports = { register };