const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const curveLessons = require('./curve_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all advanced curve tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_curve_types',
    'Lesson: Advanced Curves - Types (C, S, Convex, Concave)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = curveLessons.lessonCurveTypes(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Curve Types lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_curve_topology',
    'Lesson: Advanced Curves - Topology (Closed, Open, Symmetrical, Asymmetrical)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = curveLessons.lessonCurveTopology(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Curve Topology lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_curve_properties',
    'Lesson: Advanced Curves - Properties (Start, Direction, Curvature, Inflection, Transitions)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#607d8b') },
    async (p) => {
      const commands = curveLessons.lessonCurveProperties(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Curve Properties lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_curve_catalog',
    'Get the catalog of all available Advanced Curve lessons',
    {},
    () => {
      const catalog = curveLessons.getCurveLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Advanced Curve Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
