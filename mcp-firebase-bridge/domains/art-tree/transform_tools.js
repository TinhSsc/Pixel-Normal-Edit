const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const lessons1 = require('./transform_lessons_1');
const lessons2 = require('./transform_lessons_2');

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

/**
 * Register all shape transformation tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  // --- Scale & Deform ---
  registerTool(server, 'art_tree_lesson_transform_stretch',
    'Lesson: Transform - Stretch (Elongate a sphere or box)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#2196f3') },
    async (p) => {
      const commands = lessons1.lessonStretch(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Stretch transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_squash',
    'Lesson: Transform - Squash (Compress a sphere or box)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff9800') },
    async (p) => {
      const commands = lessons1.lessonSquash(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Squash transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_taper',
    'Lesson: Transform - Taper/Swell (Cylinder to Bottle)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#00bcd4') },
    async (p) => {
      const commands = lessons1.lessonTaperSwell(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Taper/Swell transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_bend',
    'Lesson: Transform - Bend (Cylinder to curved tube)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#e91e63') },
    async (p) => {
      const commands = lessons1.lessonBend(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Bend transformation lesson completed` }] };
    });

  // --- Boolean & Orientation ---
  registerTool(server, 'art_tree_lesson_transform_rotate',
    'Lesson: Transform - Rotate (Analyze rotation around X, Y, Z)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#ff5722') },
    async (p) => {
      const commands = lessons2.lessonRotate(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Rotate transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_cut',
    'Lesson: Transform - Cut (Truncate a sphere)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#8bc34a') },
    async (p) => {
      const commands = lessons2.lessonCut(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Cut transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_hollow',
    'Lesson: Transform - Hollow (Hollow out a cylinder)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#3f51b5') },
    async (p) => {
      const commands = lessons2.lessonHollow(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Hollow transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_combine',
    'Lesson: Transform - Combine (Intersect a box and a cylinder)',
    { canvasSize: z.number().int().min(16).max(64).default(32), color: hexColor.default('#607d8b') },
    async (p) => {
      const commands = lessons2.lessonCombine(p.canvasSize, p.color);
      await Promise.all(commands.map(cmd => sendCommand(cmd)));
      return { content: [{ type: 'text', text: `✓ Combine transformation lesson completed` }] };
    });

  registerTool(server, 'art_tree_lesson_transform_catalog',
    'Get the catalog of all available Transformation lessons',
    {},
    () => {
      const text = `📚 Transformation Lessons:
  • transform_stretch: Stretch/Elongate (Sphere -> Egg)
  • transform_squash: Squash/Compress (Sphere -> Flat disc)
  • transform_taper: Taper/Swell (Cylinder -> Bottle)
  • transform_bend: Bend (Cylinder -> Bent tube)
  • transform_rotate: Rotate (3D rotation analysis)
  • transform_cut: Cut/Truncate (Slice a form)
  • transform_hollow: Hollow out (Carve interior)
  • transform_combine: Combine (Merge forms)`;
      return { content: [{ type: 'text', text }] };
    });
}

module.exports = { register };
