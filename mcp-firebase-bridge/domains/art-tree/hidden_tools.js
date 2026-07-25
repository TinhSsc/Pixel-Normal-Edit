const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const hiddenLessons = require('./hidden_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all hidden shapes tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_hidden_box',
    'Lesson: Hidden - Understand all 6 faces of a box (X-Ray vision)',
    { canvasSize: z.number().int().min(16).max(64).default(32), visibleColor: hexColor.default('#2196f3'), hiddenColor: hexColor.default('#e0e0e0') },
    async (p) => {
      const commands = hiddenLessons.lessonHiddenBox(p.canvasSize, p.visibleColor, p.hiddenColor);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Hidden Box lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_hidden_head',
    'Lesson: Hidden - Understand the cranium sphere behind the face (X-Ray vision)',
    { canvasSize: z.number().int().min(16).max(64).default(32), visibleColor: hexColor.default('#ff5722'), hiddenColor: hexColor.default('#e0e0e0') },
    async (p) => {
      const commands = hiddenLessons.lessonHiddenHead(p.canvasSize, p.visibleColor, p.hiddenColor);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Hidden Head lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_hidden_cup',
    'Lesson: Hidden - Understand the inner depth of a cup (X-Ray vision)',
    { canvasSize: z.number().int().min(16).max(64).default(32), visibleColor: hexColor.default('#4caf50'), hiddenColor: hexColor.default('#e0e0e0') },
    async (p) => {
      const commands = hiddenLessons.lessonHiddenCup(p.canvasSize, p.visibleColor, p.hiddenColor);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Hidden Cup lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_hidden_catalog',
    'Get the catalog of all available Hidden Shapes lessons',
    {},
    () => {
      const catalog = hiddenLessons.getHiddenLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Hidden Shapes Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
