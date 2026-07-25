const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const advLessons = require('./advanced_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all advanced art-tree tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_ratios',
    'Lesson: Properties - Shape Ratios',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = advLessons.lessonShapeRatios(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Shape Ratios lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_symmetry',
    'Lesson: Properties - Symmetry & Axes',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = advLessons.lessonSymmetryAndAxis(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Symmetry & Axes lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_angles',
    'Lesson: Properties - Angles',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff5722') },
    async (p) => {
      const commands = advLessons.lessonAngles(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Angles lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_distances',
    'Lesson: Properties - Distances',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = advLessons.lessonDistances(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Distances lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_relationships',
    'Lesson: Properties - Shape Relationships',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#607d8b') },
    async (p) => {
      const commands = advLessons.lessonShapeRelationships(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Shape Relationships lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_adv_catalog',
    'Get the catalog of all available Advanced Art Tree lessons',
    {},
    () => {
      const catalog = advLessons.getAdvancedLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Advanced Art Tree Lesson Catalog:\n\n${text}` }] };
    });
}

module.exports = { register };