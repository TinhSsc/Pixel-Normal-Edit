const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const structureLessons = require('../lessons/structure');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all structure and axis tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_structure_xyz',
    'Lesson: Structure - XYZ Axes (Vertical, Horizontal, Depth directions)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = structureLessons.lessonXYZAxes(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ XYZ Axes lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_structure_bottle',
    'Lesson: Structure - Complex Analysis (Bottle with cross-sections)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = structureLessons.lessonComplexStructure(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Complex Structure (Bottle) lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_structure_orientation',
    'Lesson: Structure - Axis Orientation (Which axis is it oriented along?)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = structureLessons.lessonAxisOrientation(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Axis Orientation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_structure_catalog',
    'Get the catalog of all available Structure lessons',
    {},
    () => {
      const catalog = structureLessons.getStructureLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Structure Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
