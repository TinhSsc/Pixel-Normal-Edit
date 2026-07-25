const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const materialLessons = require('../lessons/materials');

/**
 * Register all material & surface rendering tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_material_shiny',
    'Lesson: Materials - Metal vs Matte (High contrast vs diffused highlights)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = materialLessons.lessonMaterialShiny(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Metal vs Matte material lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_material_glass',
    'Lesson: Materials - Glass (Transparency, Fresnel effect)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = materialLessons.lessonMaterialGlass(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Glass material lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_material_texture',
    'Lesson: Materials - Texture (Wood grain vs Stone cracks)',
    { canvasSize: z.number().int().min(16).max(64).default(32) },
    async (p) => {
      const commands = materialLessons.lessonMaterialTexture(p.canvasSize);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Wood vs Stone texture lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_material_catalog',
    'Get the catalog of all available Material lessons',
    {},
    () => {
      const catalog = materialLessons.getMaterialLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Material Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
