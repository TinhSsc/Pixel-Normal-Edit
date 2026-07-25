const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const analysisLessons = require('./analysis_lessons');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all analysis tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_analysis_step',
    'Lesson: Capstone - 10-Step Object Analysis of a Teapot. Pass step (1 to 10).',
    { 
      canvasSize: z.number().int().min(16).max(64).default(32),
      step: z.number().int().min(1).max(10).describe('The analysis step to view (1=Silhouette, 2=Proportions, ..., 10=Lighting)'),
      color: hexColor.default('#2196f3')
    },
    async (p) => {
      const commands = analysisLessons.lessonObjectAnalysis(p.canvasSize, p.step, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      const steps = [
        "1. Silhouette (Hình bao ngoài)",
        "2. Proportions (Tỉ lệ)",
        "3. Axis (Trục)",
        "4. Main masses (Khối lớn)",
        "5. Cross-sections (Mặt cắt)",
        "6. Transformations (Biến dạng)",
        "7. Secondary parts (Các bộ phận phụ)",
        "8. Surfaces (Bề mặt)",
        "9. Perspective (Phối cảnh)",
        "10. Lighting (Ánh sáng)"
      ];
      return { content: [{ type: 'text', text: `✓ Step ${p.step} Analysis completed: ${steps[p.step - 1]}` }] };
    });

  registerTool(server, 'art_tree_lesson_analysis_catalog',
    'Get the catalog of all available Analysis lessons',
    {},
    () => {
      const catalog = analysisLessons.getAnalysisLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Analysis Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
