const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const surfaceLessons = require('../lessons/surfaces');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all surface analysis tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_surface_types',
    'Lesson: Surfaces - Analyze Flat, Convex, and Concave planes',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = surfaceLessons.lessonSurfaceTypes(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Surface Types lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_edge_types',
    'Lesson: Surfaces - Analyze Hard vs Soft (Transitional) edges',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff5722') },
    async (p) => {
      const commands = surfaceLessons.lessonEdgeTypes(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Edge Types lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_surface_cup',
    'Lesson: Surfaces - Cup Analysis (Real object breakdown)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#607d8b') },
    async (p) => {
      const commands = surfaceLessons.lessonCupAnalysis(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Cup Surface Analysis lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_surface_chair',
    'Lesson: Surfaces - Chair Analysis (Real object breakdown)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#795548') },
    async (p) => {
      const commands = surfaceLessons.lessonChairAnalysis(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Chair Surface Analysis lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_surface_catalog',
    'Get the catalog of all available Surface lessons',
    {},
    () => {
      const catalog = surfaceLessons.getSurfaceLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Surface Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
