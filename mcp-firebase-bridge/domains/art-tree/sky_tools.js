const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const skyLessons1 = require('./sky_lessons_1');

/**
 * Register all sky and sun tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  // Phase 1 Tools
  registerTool(server, 'art_tree_lesson_sky_sun_shapes',
    'Lesson: Sun & Sky - Compare Basic, Soft, and Rays sun shapes',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = skyLessons1.lessonSunShapes(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Sun Shapes lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_sky_sunset_colors',
    'Lesson: Sun & Sky - Draw a sunset gradient (Blue to Yellow)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = skyLessons1.lessonSunsetColors(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Sunset Colors lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_sky_sunset_sky',
    'Lesson: Sun & Sky - Combine gradient sky with a soft setting sun',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = skyLessons1.lessonSunsetSky(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Sunset Sky lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_sky_catalog',
    'Get the catalog of all available Sun & Sky lessons',
    {},
    () => {
      const cat1 = skyLessons1.getSkyLesson1Catalog();
      const catalog = [...cat1];
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Sun & Sky Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
