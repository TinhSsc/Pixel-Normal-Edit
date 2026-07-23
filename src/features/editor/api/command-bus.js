import { bresenhamLine } from '../engine/algorithms/line-algo.js';
import { circlePoints } from '../engine/algorithms/circle-algo.js';

/**
 * Lớp điều phối các lệnh từ JSON (CommandBus) cho AI Agent
 */
export async function executeCommand(api, cmd) {
  if (!cmd || typeof cmd !== 'object') {
    throw new Error("Invalid command format");
  }

  const { action, ...args } = cmd;

  switch (action) {
    // 1. Operations
    case 'setTool':
      if (args.tool) api.tools.set(args.tool);
      return { success: true };

    case 'setColor':
      if (args.primary) api.color.setPrimary(args.primary);
      if (args.secondary) api.color.setSecondary(args.secondary);
      return { success: true };

    case 'undo':
      api.activeDocument.history.undo();
      return { success: true };

    case 'redo':
      api.activeDocument.history.redo();
      return { success: true };

    case 'clear':
      api.activeDocument.canvas.clear();
      return { success: true };

    case 'trim':
      api.activeDocument.canvas.trim();
      return { success: true };

    case 'setAnimationMode':
      api.modes.setAnimationMode(args.enabled);
      if (args.enabled) {
        api.activeDocument.animation.init();
      }
      return { success: true };

    case 'addFrame':
      api.activeDocument.animation.addFrame();
      return { success: true };

    case 'insertFrameAt':
      if (args.index !== undefined) api.activeDocument.animation.insertFrameAt(args.index);
      return { success: true };

    case 'removeFrame':
      if (args.index !== undefined) api.activeDocument.animation.removeFrame(args.index);
      return { success: true };

    case 'goToFrame':
      if (args.index !== undefined) api.activeDocument.animation.goToFrame(args.index);
      return { success: true };

    case 'ensureFrame':
      if (args.index !== undefined) {
        const frames = api.activeDocument.animation.getFrames();
        // Nếu frame chưa tồn tại, thêm mới cho đến khi đủ
        let currentLen = frames.length;
        while (currentLen <= args.index) {
          api.activeDocument.animation.addFrame();
          currentLen++;
        }
        api.activeDocument.animation.goToFrame(args.index);
      }
      return { success: true };

    // 2. Draw
    case 'drawPixel':
      if (args.x !== undefined && args.y !== undefined && args.color) {
        api.activeDocument.draw.setPixel(args.x, args.y, args.color);
      }
      return { success: true };

    case 'drawLine':
      if (args.x0 !== undefined && args.y0 !== undefined && args.x1 !== undefined && args.y1 !== undefined && args.color) {
        bresenhamLine(args.x0, args.y0, args.x1, args.y1, (x, y) => {
          api.activeDocument.draw.setPixel(x, y, args.color);
        });
      }
      return { success: true };

    case 'drawCircle':
      if (args.cx !== undefined && args.cy !== undefined && args.r !== undefined && args.color) {
        circlePoints(args.cx, args.cy, args.r, (x, y) => {
          api.activeDocument.draw.setPixel(x, y, args.color);
        });
      }
      return { success: true };

    case 'fill':
      if (args.x !== undefined && args.y !== undefined && args.color) {
        await api.activeDocument.draw.fill(args.x, args.y, args.color);
      }
      return { success: true };

    // 3. Queries
    case 'query':
      if (!args.type) throw new Error("Missing query type");
      let result;
      switch (args.type) {
        case 'isEmpty':
          result = api.activeDocument.query.isEmpty();
          break;
        case 'getBoundingBox':
          result = api.activeDocument.query.getBoundingBox();
          break;
        case 'getPalette':
          result = api.activeDocument.query.getPalette();
          break;
        case 'countPixels':
          result = api.activeDocument.query.countPixels(args.color);
          break;
        case 'findPixels':
          result = api.activeDocument.query.findPixels(args.color);
          break;
        default:
          throw new Error(`Unknown query type: ${args.type}`);
      }
      return { success: true, result };

    // 4. Workspace & IO
    case 'export':
      if (!args.format) throw new Error("Missing export format");
      const exportData = await api.activeDocument.io.export(args.format, args.options);
      return { success: true, result: exportData };

    case 'switchTab':
      if (args.tabId) api.workspace.switchTab(args.tabId);
      return { success: true };

    default:
      throw new Error(`Unknown command action: ${action}`);
  }
}

export async function executeCommandBatch(api, commands) {
  if (!Array.isArray(commands)) {
    throw new Error("Commands must be an array");
  }

  // Tự động gộp vào một transaction
  api.activeDocument.history.beginTransaction();
  const results = [];
  try {
    for (const cmd of commands) {
      const res = await executeCommand(api, cmd);
      results.push(res);
    }
  } catch (error) {
    // Đảm bảo commit nếu có lỗi giữa chừng để không treo trạng thái History
    api.activeDocument.history.commitTransaction();
    throw error;
  }
  api.activeDocument.history.commitTransaction();

  return results;
}
