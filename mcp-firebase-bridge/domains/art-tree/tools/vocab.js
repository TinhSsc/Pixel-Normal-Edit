const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const vocabLessons = require('../lessons/vocab');

/**
 * Register all visual vocabulary tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_vocab_house',
    'Lesson: Visual Vocabulary - 5-Step Breakdown of a House. Pass step (1 to 5).',
    { 
      canvasSize: z.number().int().min(16).max(128).default(64),
      step: z.number().int().min(1).max(5).describe('The breakdown step (1=Main Masses, 2=Structural, 3=Functional, 4=Identity, 5=Materials)')
    },
    async (p) => {
      const commands = vocabLessons.lessonVocabHouse(p.canvasSize, p.step);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      const steps = [
        "1. Main Masses (Khối chính: Thân nhà, Mái)",
        "2. Structural Parts (Bộ phận lớn: Cột, Móng, Bậc thềm)",
        "3. Functional Parts (Chức năng: Cửa, Cửa sổ)",
        "4. Identifying Details (Nhận diện: Ống khói, Viền mái, Khung cửa)",
        "5. Surface Materials (Vật liệu: Ván gỗ, Gạch)"
      ];
      return { content: [{ type: 'text', text: `✓ Step ${p.step} Vocabulary breakdown completed:\n${steps[p.step - 1]}` }] };
    });

  registerTool(server, 'art_tree_lesson_vocab_catalog',
    'Get the catalog of all available Visual Vocabulary lessons',
    {},
    () => {
      const catalog = vocabLessons.getVocabLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Visual Vocabulary Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
