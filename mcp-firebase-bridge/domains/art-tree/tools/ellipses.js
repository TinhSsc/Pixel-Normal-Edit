const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const ellipseLessons = require('../lessons/ellipses');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all ellipse tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_ellipse_orientations',
    'Lesson: Ellipses - Orientations (Horizontal, Vertical, Tilted)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = ellipseLessons.lessonEllipseOrientations(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Ellipse Orientations lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_ellipse_proportions',
    'Lesson: Ellipses - Proportions (Wide vs Narrow)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff9800') },
    async (p) => {
      const commands = ellipseLessons.lessonEllipseProportions(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Ellipse Proportions lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_ellipse_anatomy',
    'Lesson: Ellipses - Anatomy (Symmetry, Axes, Center)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = ellipseLessons.lessonEllipseAnatomy(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Ellipse Anatomy lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_coaxial_ellipses',
    'Lesson: Ellipses - Coaxial (Multiple ellipses on the same axis)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#795548') },
    async (p) => {
      const commands = ellipseLessons.lessonCoaxialEllipses(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Coaxial Ellipses lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_ellipse_catalog',
    'Get the catalog of all available Ellipse lessons',
    {},
    () => {
      const catalog = ellipseLessons.getEllipseLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Ellipse Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
