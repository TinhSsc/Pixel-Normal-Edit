const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const csLessons = require('./cross_section_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all cross-section tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_cs_bottle',
    'Lesson: Cross-sections - Bottle Analysis (Base, body, shoulder, neck, mouth)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = csLessons.lessonBottleSections(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Bottle Cross-sections lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_cs_glass',
    'Lesson: Cross-sections - Glass Analysis (Base, mid, mouth)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = csLessons.lessonGlassSections(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Glass Cross-sections lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_cs_head',
    'Lesson: Cross-sections - Head Analysis (Cranium, face, jaw)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff9800') },
    async (p) => {
      const commands = csLessons.lessonHeadSections(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Head Cross-sections lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_cs_catalog',
    'Get the catalog of all available Cross-section lessons',
    {},
    () => {
      const catalog = csLessons.getCrossSectionLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Cross-section Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
