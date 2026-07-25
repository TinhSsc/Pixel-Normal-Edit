const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const layerLessons = require('./layer_lessons');

/**
 * Register all layer tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_layer_step',
    'Lesson: Layer Structure - See exactly what belongs on each layer of a Cup (1 to 7).',
    { 
      canvasSize: z.number().int().min(16).max(64).default(32),
      layer: z.number().int().min(1).max(7).describe('The layer index (1=Ref, 2=Sketch, 3=Construction, 4=Lineart, 5=Color, 6=Shadow, 7=Light)')
    },
    async (p) => {
      const commands = layerLessons.lessonLayerStep(p.canvasSize, p.layer);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      const layers = [
        "1. Reference (Ảnh tham khảo)",
        "2. Sketch (Phác thảo)",
        "3. Construction (Dựng hình)",
        "4. Lineart (Nét chính)",
        "5. Base Color (Màu cơ bản)",
        "6. Shadow (Bóng tối)",
        "7. Light (Ánh sáng)"
      ];
      return { content: [{ type: 'text', text: `✓ Layer ${p.layer} visualization completed: ${layers[p.layer - 1]}` }] };
    });

  registerTool(server, 'art_tree_lesson_layer_catalog',
    'Get the catalog of all available Layer Structure lessons',
    {},
    () => {
      const catalog = layerLessons.getLayerLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 Layer Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
