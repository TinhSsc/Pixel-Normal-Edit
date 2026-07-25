const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const lightLessons = require('../lessons/lighting');

/**
 * Register all lighting & shading tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_light_zones',
    'Lesson: Lighting - 6 Zones of Light and Shadow on a Sphere',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = lightLessons.lessonLightZones(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 6 Zones of Light lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_light_dir',
    'Lesson: Lighting - Light Direction and Plane values on a Box',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = lightLessons.lessonLightDirection(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Light Direction lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_light_contact',
    'Lesson: Lighting - Contact Shadow (Darkest point of intersection)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = lightLessons.lessonContactShadow(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Contact Shadow lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_light_catalog',
    'Get the catalog of all available Lighting lessons',
    {},
    () => {
      const catalog = lightLessons.getLightLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Lighting Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
