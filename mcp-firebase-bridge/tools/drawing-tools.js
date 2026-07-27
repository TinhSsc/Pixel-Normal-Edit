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
const workflow = require('../rules/workflow');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

function register(server) {
  registerTool(server, 'draw_pixel',
    'Set a single pixel to a color',
    { objectId: z.string(), milestone: z.string(), x: z.number().int().max(1024).describe('X coordinate'), y: z.number().int().max(1024).describe('Y coordinate'), color: hexColor },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_pixel', { x: p.x, y: p.y, w: 1, h: 1 }, p.color, p.milestone);
      return { action: 'drawPixel', ...p };
    });

  registerTool(server, 'draw_erase',
    'Erase a single pixel (make transparent)',
    { objectId: z.string(), milestone: z.string(), x: z.number().int().max(1024), y: z.number().int().max(1024) },
    (p) => ({ action: 'erasePixel', ...p }));

  registerTool(server, 'draw_pixels_bulk',
    'Set multiple pixels at once (much faster than calling draw_pixel repeatedly)',
    {
      objectId: z.string(), milestone: z.string(),
      pixels: z.array(z.object({
        x: z.number().int().max(1024),
        y: z.number().int().max(1024),
        color: hexColor.optional()
      })).max(5000).describe('Array of pixels {x, y, color}. Omit color to erase.')
    },
    (p) => ({ action: 'drawPixelsBulk', pixels: p.pixels }));

  registerTool(server, 'draw_line',
    'Draw a straight line using Bresenham algorithm',
    { objectId: z.string(), milestone: z.string(), x0: z.number().int().max(1024), y0: z.number().int().max(1024), x1: z.number().int().max(1024), y1: z.number().int().max(1024), color: hexColor },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_line', { x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 }, p.color, p.milestone);
      return { action: 'drawLine', ...p };
    });

  registerTool(server, 'draw_rect',
    'Draw a rectangle (outline or filled) with optional rounded corners',
    {
      objectId: z.string(), milestone: z.string(), x: z.number().int().max(1024), y: z.number().int().max(1024),
      w: z.number().int().min(1).max(256).describe('Width (max 256)'),
      h: z.number().int().min(1).max(256).describe('Height (max 256)'),
      color: hexColor,
      filled: z.boolean().default(false),
      r: z.number().int().min(0).default(0).describe('Corner radius for rounded rectangle (0 for sharp corners)')
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_rect', { x: p.x, y: p.y, w: p.w, h: p.h }, p.color, p.milestone);
      return { action: 'drawRect', ...p };
    });

  registerTool(server, 'draw_circle',
    'Draw a circle (outline or filled)',
    {
      objectId: z.string(), milestone: z.string(), cx: z.number().int().max(1024).describe('Center X'), cy: z.number().int().max(1024).describe('Center Y'),
      r: z.number().int().min(1).max(128).describe('Radius (max 128)'), color: hexColor, filled: z.boolean().default(false),
      smooth: z.boolean().default(true).describe('Apply anti-jaggy filter to remove protruding pixels')
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_circle', { cx: p.cx, cy: p.cy, r: p.r }, p.color, p.milestone);
      return { action: 'drawCircle', ...p };
    });

  registerTool(server, 'draw_ellipse',
    'Draw an ellipse (outline or filled)',
    {
      objectId: z.string(), milestone: z.string(), cx: z.number().int().max(1024), cy: z.number().int().max(1024), rx: z.number().int().min(1).max(128).describe('Horizontal radius'),
      ry: z.number().int().min(1).max(128).describe('Vertical radius'), color: hexColor, filled: z.boolean().default(false),
      smooth: z.boolean().default(true).describe('Apply anti-jaggy filter to remove protruding pixels')
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_ellipse', { cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry }, p.color, p.milestone);
      return { action: 'drawEllipse', ...p };
    });

  registerTool(server, 'draw_polygon',
    'Draw a polygon from a list of points (outline or filled)',
    {
      objectId: z.string(), milestone: z.string(),
      points: z.array(z.object({ x: z.number().int().max(1024), y: z.number().int().max(1024) })).min(3).describe('Array of {x,y} vertices'),
      color: hexColor, filled: z.boolean().default(false)
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_polygon', { points: p.points.length }, p.color, p.milestone);
      return { action: 'drawPolygon', ...p };
    });

  registerTool(server, 'draw_fill',
    'Flood-fill starting from (x,y) with a color',
    { objectId: z.string(), milestone: z.string(), x: z.number().int().max(1024), y: z.number().int().max(1024), color: hexColor },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_fill', { x: p.x, y: p.y }, p.color, p.milestone);
      return { action: 'fill', ...p };
    });

  registerTool(server, 'draw_gradient_rect',
    'Draw a rectangle filled with a smooth gradient',
    {
      objectId: z.string(), milestone: z.string(),
      x: z.number().int().max(1024), y: z.number().int().max(1024), w: z.number().int().min(1).max(256).describe('Width (max 256)'), h: z.number().int().min(1).max(256).describe('Height (max 256)'),
      colorFrom: hexColor.describe('Start color'), colorTo: hexColor.describe('End color'),
      direction: z.enum(['h', 'v']).default('h').describe('h=horizontal, v=vertical')
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'draw_gradient_rect', { x: p.x, y: p.y, w: p.w, h: p.h, direction: p.direction }, `${p.colorFrom}-${p.colorTo}`, p.milestone);
      return { action: 'drawGradientRect', ...p };
    });

  registerTool(server, 'bulk_replace_color',
    'Replace ALL pixels of one color with another across the entire canvas',
    { objectId: z.string(), milestone: z.string(), from: hexColor.describe('Color to replace'), to: hexColor.describe('New color') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'bulk_replace_color', { from: p.from }, p.to, p.milestone);
      return { action: 'replaceColor', from: p.from, to: p.to };
    });

  registerTool(server, 'bulk_flood_fill_all',
    'Flood-fill every disconnected region of a given color',
    { objectId: z.string(), milestone: z.string(), color: hexColor.describe('Color to replace'), to: hexColor.describe('Replacement color') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      workflow.logDrawMetadata(session, p.objectId, 'bulk_flood_fill_all', { color: p.color }, p.to, p.milestone);
      return { action: 'floodFillAll', color: p.color, to: p.to };
    });
}

module.exports = { register };