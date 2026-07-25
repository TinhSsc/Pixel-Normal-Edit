const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const perspLessons = require('./perspective_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all perspective tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_persp_1point',
    'Lesson: Perspective - 1-Point Perspective (Horizon, 1 VP, Front vs Receding)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = perspLessons.lesson1PointPerspective(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 1-Point Perspective lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_persp_2point',
    'Lesson: Perspective - 2-Point Perspective (Horizon, 2 VPs)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#4caf50') },
    async (p) => {
      const commands = perspLessons.lesson2PointPerspective(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 2-Point Perspective lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_persp_3point',
    'Lesson: Perspective - 3-Point Perspective (Bird\'s eye view)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff9800') },
    async (p) => {
      const commands = perspLessons.lesson3PointPerspective(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 3-Point Perspective lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_persp_foreshorten',
    'Lesson: Perspective - Foreshortening (Depth foreshortening)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = perspLessons.lessonForeshortening(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Foreshortening lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_persp_catalog',
    'Get the catalog of all available Perspective lessons',
    {},
    () => {
      const catalog = perspLessons.getPerspectiveLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Perspective Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
