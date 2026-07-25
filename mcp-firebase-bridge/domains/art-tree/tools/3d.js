const { z } = require('zod');
const { registerTool, sendCommand } = require('../../../core/server');
const lessons3d = require('../lessons/3d');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all 3D tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'art_tree_lesson_3d_box',
    'Lesson: 3D Forms - Box Properties (Width, Height, Depth, Planes)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = lessons3d.lessonBoxProperties(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 3D Box Properties lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_3d_sphere',
    'Lesson: 3D Forms - Sphere Properties (Center, Radius, Cross contours)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#9c27b0') },
    async (p) => {
      const commands = lessons3d.lessonSphereProperties(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 3D Sphere Properties lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_3d_cylinder',
    'Lesson: 3D Forms - Cylinder Properties (Axis, Bases, Height)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = lessons3d.lessonCylinderProperties(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 3D Cylinder Properties lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_3d_cone',
    'Lesson: 3D Forms - Cone Properties (Apex, Base, Axis)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff5722') },
    async (p) => {
      const commands = lessons3d.lessonConeProperties(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ 3D Cone Properties lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_3d_catalog',
    'Get the catalog of all available 3D Form lessons',
    {},
    () => {
      const catalog = lessons3d.get3DLessonCatalog();
      const text = catalog.map(l =>
        `  • ${l.id}: ${l.name} — ${l.description}`
      ).join('\n');
      return { content: [{ type: 'text', text: `📚 3D Form Lessons:\n\n${text}` }] };
    });
}

module.exports = { register };
