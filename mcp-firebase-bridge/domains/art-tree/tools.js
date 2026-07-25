#!/usr/bin/env node
/**
 * tools.js — Art Tree: MCP Tool Registration
 *
 * Layer: MCP Tool API (exposes Shape API and Lesson API as MCP tools)
 *
 * Registers art-tree tools on the MCP server. These tools use
 * the existing primitive actions (drawLine, drawRect, etc.) via
 * sendCommand — they do NOT create their own drawing system.
 */
const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const shapes = require('./shapes');
const lessons = require('./lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all art-tree tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  // ── Shape Tools ───────────────────────────────────────────────────────

  registerTool(server, 'art_tree_draw_line',
    'Draw a straight line between two points (Art Tree shape lesson)',
    { x0: z.number().int(), y0: z.number().int(), x1: z.number().int(), y1: z.number().int(), color: hexColor },
    (p) => shapes.drawLine(p.x0, p.y0, p.x1, p.y1, p.color));

  registerTool(server, 'art_tree_draw_square',
    'Draw a square aligned to axes (Art Tree shape lesson)',
    { x: z.number().int().describe('Top-left X'), y: z.number().int().describe('Top-left Y'),
      size: z.number().int().min(1).describe('Side length'), color: hexColor,
      filled: z.boolean().default(false) },
    (p) => shapes.drawSquare(p.x, p.y, p.size, p.color, p.filled));

  registerTool(server, 'art_tree_draw_rectangle',
    'Draw a rectangle aligned to axes (Art Tree shape lesson)',
    { x: z.number().int().describe('Top-left X'), y: z.number().int().describe('Top-left Y'),
      w: z.number().int().min(1).describe('Width'), h: z.number().int().min(1).describe('Height'),
      color: hexColor, filled: z.boolean().default(false) },
    (p) => shapes.drawRectangle(p.x, p.y, p.w, p.h, p.color, p.filled));

  registerTool(server, 'art_tree_draw_circle',
    'Draw a circle (Art Tree shape lesson)',
    { cx: z.number().int().describe('Center X'), cy: z.number().int().describe('Center Y'),
      r: z.number().int().min(1).describe('Radius'), color: hexColor,
      filled: z.boolean().default(false) },
    (p) => shapes.drawCircle(p.cx, p.cy, p.r, p.color, p.filled));

  registerTool(server, 'art_tree_draw_ellipse',
    'Draw an ellipse (Art Tree shape lesson)',
    { cx: z.number().int(), cy: z.number().int(),
      rx: z.number().int().min(1).describe('Horizontal radius'),
      ry: z.number().int().min(1).describe('Vertical radius'),
      color: hexColor, filled: z.boolean().default(false) },
    (p) => shapes.drawEllipse(p.cx, p.cy, p.rx, p.ry, p.color, p.filled));

  registerTool(server, 'art_tree_draw_triangle',
    'Draw a triangle from three vertices (Art Tree shape lesson)',
    { x1: z.number().int(), y1: z.number().int(), x2: z.number().int(), y2: z.number().int(),
      x3: z.number().int(), y3: z.number().int(), color: hexColor,
      filled: z.boolean().default(false) },
    (p) => shapes.drawTriangle([
      { x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }, { x: p.x3, y: p.y3 }
    ], p.color, p.filled));

  registerTool(server, 'art_tree_draw_equilateral_triangle',
    'Draw an equilateral triangle centered at (cx, cy) (Art Tree shape lesson)',
    { cx: z.number().int(), cy: z.number().int(),
      sideLength: z.number().int().min(1).describe('Length of each side'),
      color: hexColor, filled: z.boolean().default(false) },
    (p) => shapes.drawEquilateralTriangle(p.cx, p.cy, p.sideLength, p.color, p.filled));

  registerTool(server, 'art_tree_draw_regular_polygon',
    'Draw a regular polygon (Art Tree shape lesson)',
    { cx: z.number().int(), cy: z.number().int(),
      sides: z.number().int().min(3).max(12).describe('Number of sides (3-12)'),
      radius: z.number().int().min(1).describe('Distance from center to vertices'),
      color: hexColor, filled: z.boolean().default(false) },
    (p) => shapes.drawRegularPolygon(p.cx, p.cy, p.sides, p.radius, p.color, p.filled));

  registerTool(server, 'art_tree_draw_grid',
    'Draw a grid of squares (Art Tree foundation lesson)',
    { startX: z.number().int().default(0), startY: z.number().int().default(0),
      cols: z.number().int().min(1).max(32).describe('Number of columns'),
      rows: z.number().int().min(1).max(32).describe('Number of rows'),
      cellSize: z.number().int().min(1).max(16).describe('Size of each cell'),
      color: hexColor.default('#cccccc') },
    async (p) => {
      const commands = shapes.drawGrid(p.startX, p.startY, p.cols, p.rows, p.cellSize, p.color);
      const results = await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Grid (${p.cols}×${p.rows}) drawn with ${commands.length} lines` }] };
    });

  // ── Lesson Tools ──────────────────────────────────────────────────────

  registerTool(server, 'art_tree_lesson_lines',
    'Lesson: Lines — Introduction to drawing straight lines',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#ff0000') },
    async (p) => {
      const commands = lessons.lessonLines(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Lines lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_squares',
    'Lesson: Squares & Rectangles — Understanding right angles and proportions',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#1565c0') },
    async (p) => {
      const commands = lessons.lessonSquares(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Squares & Rectangles lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_circles',
    'Lesson: Circles — Learning curves and symmetry',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#e91e63') },
    async (p) => {
      const commands = lessons.lessonCircles(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Circles lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_ellipses',
    'Lesson: Ellipses — Understanding oval shapes and proportions',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = lessons.lessonEllipses(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Ellipses lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_triangles',
    'Lesson: Triangles — Three-point shapes and stability',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#ff5722') },
    async (p) => {
      const commands = lessons.lessonTriangles(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Triangles lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_polygons',
    'Lesson: Polygons — Multi-sided shapes',
    { canvasSize: z.number().int().min(16).max(64).default(32),
      color: hexColor.default('#607d8b') },
    async (p) => {
      const commands = lessons.lessonPolygons(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Polygons lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_composition',
    'Lesson: Composition — Combining basic shapes to create simple objects (house, sun, tree)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = lessons.lessonComposition(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Composition lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_freehand',
    'Lesson: Freehand Drawing — Practice freehand drawing without rulers',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#795548') },
    async (p) => {
      const commands = lessons.lessonFreehand(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Freehand drawing lesson completed (${commands.length} small segments)` }] };
    });

  registerTool(server, 'art_tree_lesson_proportions',
    'Lesson: Proportions and Angles — Practice maintaining proportions and angles',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#3f51b5') },
    async (p) => {
      const commands = lessons.lessonProportionsAndAngles(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Proportions and Angles lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_curves',
    'Lesson: Curves — C-curves and S-curves',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = lessons.lessonCurves(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Curves (C, S) lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_spiral',
    'Lesson: Spiral — Drawing spiral curves',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff9800') },
    async (p) => {
      const commands = lessons.lessonSpiral(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Spiral lesson completed (${commands.length} strokes)` }] };
    });

  registerTool(server, 'art_tree_lesson_strokes',
    'Lesson: Stroke Types — Long strokes, short strokes, thick and thin lines',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = lessons.lessonStrokes(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Strokes lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_parallel_intersecting',
    'Lesson: Parallel & Intersecting Lines — Drawing parallel and intersecting lines',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = lessons.lessonParallelAndIntersecting(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Parallel & Intersecting Lines lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_catalog',
    'Get the catalog of all available Art Tree lessons with descriptions',
    {},
    () => {
      const catalog = lessons.getLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Art Tree Lesson Catalog:\n\n${text}` }] };
    });
}

module.exports = { register };