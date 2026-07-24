/**
 * MCP Firebase Bridge v2
 * ─────────────────────────────────────────────────────────────────────────
 * Exposes Pixel Normal Edit's canvas API as structured MCP tools.
 * Each tool maps 1:1 to a command-bus action with full schema validation.
 *
 * Third-party AI agents (Claude, GPT, Gemini via MCP) get:
 *  - Named, discoverable tools instead of one generic "execute" tool
 *  - Per-parameter validation (Zod schemas)
 *  - Rich descriptions so AI knows exactly what each param does
 *  - Visual feedback via querySnapshot / exportBase64
 */

const { McpServer }              = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport }   = require('@modelcontextprotocol/sdk/server/stdio.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z }                      = require('zod');
const { initializeApp }          = require('firebase/app');
const { getFirestore, doc, setDoc, onSnapshot } = require('firebase/firestore');
const dotenv                     = require('dotenv');
const path                       = require('path');
const crypto                     = require('crypto');
const http                       = require('http');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = getFirestore(initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBSrvCt58Jhsh14wbC2bD2KLFUUVbAVim0',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'pixel-normal-edit.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'pixel-normal-edit',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'pixel-normal-edit.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '397075334229',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:397075334229:web:b02eede3fc7b41d02f80dc',
}));

const SESSION = process.argv[2] || process.env.MCP_SESSION || 'default-session';
const TIMEOUT = parseInt(process.env.MCP_TIMEOUT || '20000');

// ── Core: send any JSON command → wait for browser response ───────────────
async function sendCommand(payload) {
  const id = crypto.randomUUID();
  const ref = doc(db, 'mcp_sessions', SESSION, 'commands', id);
  await setDoc(ref, { ...payload, status: 'pending', timestamp: Date.now() });

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve({ isError: true, content: [{ type: 'text', text: `⏱ Timeout (${TIMEOUT}ms). Is the browser tab open with session: ${SESSION}?` }] });
    }, TIMEOUT);

    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data();
      if (!d) return;
      if (d.status === 'success') {
        clearTimeout(timer); unsub();
        const out = d.result !== undefined ? JSON.stringify(d.result, null, 2) : '✓ Done';
        resolve({ content: [{ type: 'text', text: out }] });
      } else if (d.status === 'error') {
        clearTimeout(timer); unsub();
        resolve({ isError: true, content: [{ type: 'text', text: `❌ ${d.error}` }] });
      }
    });
  });
}

// ── Tool factory: single-command tool ─────────────────────────────────────
function tool(server, name, desc, schema, mapToCmd) {
  server.tool(name, desc, schema, async (params) => sendCommand(mapToCmd(params)));
}

// ═══════════════════════════════════════════════════════════════════════════
const server = new McpServer({ name: 'PixelNormalEdit', version: '2.0.0' });

// ─────────────────────────────────────────────────────────────────────────
// GROUP 1: CANVAS & SETUP
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'canvas_get_size',
  'Get current canvas dimensions {width, height}',
  {},
  () => ({ action: 'getSize' }));

tool(server, 'canvas_resize',
  'Resize canvas to new dimensions. mode=clear resets pixels, extend keeps them.',
  {
    width: z.number().int().min(1).max(1024).describe('New width in pixels'),
    height: z.number().int().min(1).max(1024).describe('New height in pixels'),
    mode: z.enum(['clear', 'extend', 'fit']).default('clear').describe('How to handle existing content'),
    dx: z.number().int().default(0).describe('X offset for content when extending'),
    dy: z.number().int().default(0).describe('Y offset for content when extending')
  },
  (p) => ({ action: 'resize', ...p }));

tool(server, 'canvas_clear',
  'Erase all pixels on the current canvas frame',
  {},
  () => ({ action: 'clear' }));

tool(server, 'canvas_trim',
  'Auto-trim transparent borders from canvas',
  {},
  () => ({ action: 'trim' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 2: WORKSPACE / TABS
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'workspace_list_tabs',
  'List all open document tabs with their IDs and names',
  {},
  () => ({ action: 'listTabs' }));

tool(server, 'workspace_get_active_tab',
  'Get the currently active tab ID',
  {},
  () => ({ action: 'getActiveTabId' }));

tool(server, 'workspace_create_tab',
  'Create a new blank canvas tab',
  {
    name: z.string().optional().describe('Tab name'),
    width: z.number().int().default(32).describe('Canvas width'),
    height: z.number().int().default(32).describe('Canvas height')
  },
  (p) => ({ action: 'createTab', ...p }));

tool(server, 'workspace_switch_tab',
  'Switch to a different tab by ID (get IDs from workspace_list_tabs)',
  { tabId: z.string().describe('Tab ID to switch to') },
  (p) => ({ action: 'switchTab', tabId: p.tabId }));

tool(server, 'workspace_rename_tab',
  'Rename a tab',
  { tabId: z.string(), name: z.string() },
  (p) => ({ action: 'renameTab', ...p }));

tool(server, 'workspace_save',
  'Quick-save the current workspace',
  {},
  () => ({ action: 'quickSave' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 3: ANIMATION FRAMES
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'animation_enable',
  'Enable or disable animation mode. When enabled, the canvas has multiple frames.',
  { enabled: z.boolean().describe('true to enable, false to disable') },
  (p) => ({ action: 'setAnimationMode', enabled: p.enabled }));

tool(server, 'animation_add_frame',
  'Append a new blank frame to the animation',
  {},
  () => ({ action: 'addFrame' }));

tool(server, 'animation_go_to_frame',
  'Switch to editing a specific frame by index (0-based)',
  { index: z.number().int().min(0).describe('Frame index') },
  (p) => ({ action: 'goToFrame', index: p.index }));

tool(server, 'animation_ensure_frame',
  'Make sure the animation has at least (index+1) frames, then switch to that frame',
  { index: z.number().int().min(0).describe('Target frame index') },
  (p) => ({ action: 'ensureFrame', index: p.index }));

tool(server, 'animation_get_info',
  'Get current frame count and active frame index',
  {},
  async () => {
    const [count, idx] = await Promise.all([
      sendCommand({ action: 'getFrameCount' }),
      sendCommand({ action: 'getActiveFrameIndex' }),
    ]);
    return { content: [{ type: 'text', text: JSON.stringify({ frameCount: count, activeIndex: idx }) }] };
  });

tool(server, 'animation_remove_frame',
  'Remove frame at the given index',
  { index: z.number().int().min(0) },
  (p) => ({ action: 'removeFrame', index: p.index }));

tool(server, 'animation_reorder_frame',
  'Move a frame from one position to another',
  { from: z.number().int().min(0), to: z.number().int().min(0) },
  (p) => ({ action: 'reorderFrame', from: p.from, to: p.to }));

tool(server, 'animation_compare_frames',
  'Get list of pixel differences between two frames',
  { frameIndex1: z.number().int().min(0), frameIndex2: z.number().int().min(0) },
  (p) => ({ action: 'getFrameDifferences', ...p }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 4: DRAWING PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color e.g. #ff0000');

tool(server, 'draw_pixel',
  'Set a single pixel to a color',
  {
    x: z.number().int().describe('X coordinate'),
    y: z.number().int().describe('Y coordinate'),
    color: hexColor
  },
  (p) => ({ action: 'drawPixel', ...p }));

tool(server, 'draw_erase',
  'Erase a single pixel (make transparent)',
  { x: z.number().int(), y: z.number().int() },
  (p) => ({ action: 'erasePixel', ...p }));

tool(server, 'draw_line',
  'Draw a straight line using Bresenham algorithm',
  {
    x0: z.number().int(), y0: z.number().int(),
    x1: z.number().int(), y1: z.number().int(),
    color: hexColor
  },
  (p) => ({ action: 'drawLine', ...p }));

tool(server, 'draw_rect',
  'Draw a rectangle (outline or filled)',
  {
    x: z.number().int().describe('Top-left X'),
    y: z.number().int().describe('Top-left Y'),
    w: z.number().int().min(1).describe('Width'),
    h: z.number().int().min(1).describe('Height'),
    color: hexColor,
    filled: z.boolean().default(false).describe('Fill interior?')
  },
  (p) => ({ action: 'drawRect', ...p }));

tool(server, 'draw_circle',
  'Draw a circle (outline or filled)',
  {
    cx: z.number().int().describe('Center X'),
    cy: z.number().int().describe('Center Y'),
    r: z.number().int().min(1).describe('Radius'),
    color: hexColor,
    filled: z.boolean().default(false)
  },
  (p) => ({ action: 'drawCircle', ...p }));

tool(server, 'draw_ellipse',
  'Draw an ellipse (outline or filled)',
  {
    cx: z.number().int(), cy: z.number().int(),
    rx: z.number().int().min(1).describe('Horizontal radius'),
    ry: z.number().int().min(1).describe('Vertical radius'),
    color: hexColor,
    filled: z.boolean().default(false)
  },
  (p) => ({ action: 'drawEllipse', ...p }));

tool(server, 'draw_polygon',
  'Draw a polygon from a list of points (outline or filled)',
  {
    points: z.array(z.object({ x: z.number().int(), y: z.number().int() })).min(3).describe('Array of {x,y} vertices'),
    color: hexColor,
    filled: z.boolean().default(false)
  },
  (p) => ({ action: 'drawPolygon', ...p }));

tool(server, 'draw_fill',
  'Flood-fill starting from (x,y) with a color',
  { x: z.number().int(), y: z.number().int(), color: hexColor },
  (p) => ({ action: 'fill', ...p }));

tool(server, 'draw_gradient_rect',
  'Draw a rectangle filled with a smooth gradient',
  {
    x: z.number().int(), y: z.number().int(),
    w: z.number().int().min(1), h: z.number().int().min(1),
    colorFrom: hexColor.describe('Start color'),
    colorTo: hexColor.describe('End color'),
    direction: z.enum(['h', 'v']).default('h').describe('h=horizontal, v=vertical')
  },
  (p) => ({ action: 'drawGradientRect', ...p }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 5: BULK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'bulk_replace_color',
  'Replace ALL pixels of one color with another across the entire canvas',
  {
    from: hexColor.describe('Color to replace'),
    to: hexColor.describe('New color')
  },
  (p) => ({ action: 'replaceColor', from: p.from, to: p.to }));

tool(server, 'bulk_flood_fill_all',
  'Flood-fill every disconnected region of a given color',
  {
    color: hexColor.describe('Color to replace'),
    to: hexColor.describe('Replacement color')
  },
  (p) => ({ action: 'floodFillAll', color: p.color, to: p.to }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 6: SPRITE / STAMP SYSTEM
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'sprite_draw',
  `Draw a sprite using ASCII art + color palette. Each character in the data array maps to a color.
EXAMPLE:
  palette: { "H": "#ffcc99", "B": "#1565c0", ".": null }
  data:    [ "..H..", ".BBB.", "..H.." ]
This is the most efficient way to draw complex shapes — replaces dozens of drawPixel calls.`,
  {
    x: z.number().int().default(0).describe('Top-left X offset'),
    y: z.number().int().default(0).describe('Top-left Y offset'),
    palette: z.record(z.string().length(1), z.string().nullable()).describe('Char→hex map. null = transparent/skip'),
    data: z.array(z.string()).min(1).describe('Rows of ASCII art characters')
  },
  (p) => ({ action: 'drawSprite', ...p }));

tool(server, 'sprite_save_stamp',
  'Save a named sprite for reuse across frames. Use sprite_use_stamp to place it.',
  {
    name: z.string().describe('Unique stamp name'),
    palette: z.record(z.string().length(1), z.string().nullable()),
    data: z.array(z.string()).min(1)
  },
  (p) => ({ action: 'saveStamp', ...p }));

tool(server, 'sprite_use_stamp',
  'Place a previously saved stamp at a position. Optionally override palette colors.',
  {
    name: z.string().describe('Stamp name (from sprite_save_stamp)'),
    x: z.number().int().default(0),
    y: z.number().int().default(0),
    palette: z.record(z.string().length(1), z.string().nullable()).optional().describe('Override specific palette colors')
  },
  (p) => ({ action: 'useStamp', ...p }));

tool(server, 'sprite_list_stamps',
  'List all saved stamp names',
  {},
  () => ({ action: 'listStamps' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 7: REGION CLIPBOARD
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'region_copy',
  'Copy a rectangular region of pixels to an internal clipboard',
  {
    x: z.number().int().default(0), y: z.number().int().default(0),
    w: z.number().int().min(1).describe('Width of region'),
    h: z.number().int().min(1).describe('Height of region')
  },
  (p) => ({ action: 'copyRegion', ...p }));

tool(server, 'region_paste',
  'Paste the clipboard region at (x,y). Defaults to original position.',
  {
    x: z.number().int().optional().describe('X destination (default: original X)'),
    y: z.number().int().optional().describe('Y destination (default: original Y)')
  },
  (p) => ({ action: 'pasteRegion', ...p }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 8: FILTERS
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'filter_apply',
  `Apply a visual filter to the canvas (or a region).
Types: brightness (value: -255 to 255), invert, grayscale, hue-rotate (value: degrees 0-360)`,
  {
    type: z.enum(['brightness', 'invert', 'grayscale', 'hue-rotate']),
    value: z.number().optional().describe('Parameter: brightness=-255..255, hue-rotate=0..360'),
    x: z.number().int().optional(), y: z.number().int().optional(),
    w: z.number().int().optional(), h: z.number().int().optional()
  },
  (p) => ({ action: 'applyFilter', ...p }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 9: ANCHORS
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'anchor_set',
  'Set a named coordinate anchor for relative drawing. E.g. anchor "head" at (20,5) then draw relative to it.',
  {
    name: z.string().describe('Anchor name'),
    x: z.number().int(), y: z.number().int()
  },
  (p) => ({ action: 'setAnchor', ...p }));

tool(server, 'anchor_get',
  'Get position of a named anchor',
  { name: z.string() },
  (p) => ({ action: 'getAnchor', name: p.name }));

tool(server, 'anchor_list',
  'List all named anchors',
  {},
  () => ({ action: 'listAnchors' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 10: QUERY & VISUAL FEEDBACK ← Critical for AI agents
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'query_snapshot',
  `Get an ASCII art representation of the current canvas frame. Use this to "see" what you've drawn before continuing.
Returns: { ascii, legend, width, height } where each symbol in ascii maps to a hex color via legend.
Increase scale to get a smaller grid (scale=2 means 1 char = 2×2 pixels).`,
  {
    scale: z.number().int().min(1).max(8).default(1).describe('Downscale factor (1=full resolution)'),
    maxColors: z.number().int().min(2).max(32).default(12).describe('Max distinct colors in legend')
  },
  (p) => ({ action: 'querySnapshot', ...p }));

tool(server, 'query_bounding_box',
  'Get the bounding box of all non-transparent pixels {minX, minY, maxX, maxY, width, height}',
  {},
  () => ({ action: 'query', type: 'getBoundingBox' }));

tool(server, 'query_palette',
  'Get list of all distinct colors used on the canvas',
  {},
  () => ({ action: 'query', type: 'getPalette' }));

tool(server, 'query_pixel',
  'Get the color of a specific pixel. Returns hex string or null if transparent.',
  { x: z.number().int(), y: z.number().int() },
  (p) => ({ action: 'getPixel', x: p.x, y: p.y }));

tool(server, 'query_export_image',
  `Export the current frame as a base64 PNG data URL.
Use this to visually verify your work — paste the dataUrl into an image viewer.
The dataUrl starts with "data:image/png;base64,..."`,
  { format: z.enum(['png', 'webp', 'jpeg']).default('png') },
  (p) => ({ action: 'exportBase64', format: p.format }));

tool(server, 'query_document_state',
  'Get full document state: tab name, canvas size, animation info, undo availability',
  {},
  () => ({ action: 'query', type: 'getDocumentState' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 11: HISTORY
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'history_undo',
  'Undo the last drawing action',
  {},
  () => ({ action: 'undo' }));

tool(server, 'history_redo',
  'Redo the last undone action',
  {},
  () => ({ action: 'redo' }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 12: MODES
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'mode_set_mirror',
  'Enable/disable mirror drawing mode (symmetric left-right)',
  { enabled: z.boolean() },
  (p) => ({ action: 'setMirror', enabled: p.enabled }));

tool(server, 'mode_set_onion_skin',
  'Enable/disable onion skin (shows previous frame as ghost)',
  { enabled: z.boolean() },
  (p) => ({ action: 'setOnionSkin', enabled: p.enabled }));

tool(server, 'mode_set_grid',
  'Show/hide the pixel grid overlay',
  { enabled: z.boolean() },
  (p) => ({ action: 'setGrid', enabled: p.enabled }));

// ─────────────────────────────────────────────────────────────────────────
// GROUP 13: COLOR
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'color_set',
  'Set the primary and/or secondary color',
  { primary: hexColor.optional(), secondary: hexColor.optional() },
  (p) => ({ action: 'setColor', ...p }));

tool(server, 'color_get',
  'Get current primary and secondary colors',
  {},
  () => ({ action: 'getColor' }));

// ─────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────
tool(server, 'ping',
  'Check if the browser editor is connected and responding',
  {},
  () => ({ action: 'ping' }));

// ═══════════════════════════════════════════════════════════════════════════
// MODE: stdio (default) OR http (when --http flag or HTTP_PORT env is set)
// ─────────────────────────────────────────────────────────────────────────
const HTTP_PORT = process.env.HTTP_PORT || (process.argv.includes('--http') ? 3456 : null);

async function startStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Pixel Normal Edit MCP Bridge v2 (stdio mode)');
  console.error(`   Session : ${SESSION}`);
  console.error(`   Editor  : http://localhost:5173?mcp_session=${SESSION}`);
}

async function startHttp(port) {
  // Each HTTP request gets its own transport instance (stateless)
  const app = http.createServer(async (req, res) => {
    // CORS for browser tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, session: SESSION, ts: Date.now() }));
      return;
    }

    if (req.url !== '/mcp') {
      res.writeHead(404); res.end('Use /mcp'); return;
    }

    // Read body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        enableJsonResponse: true,
      });
      const freshServer = buildServer(); // new McpServer instance per request
      await freshServer.connect(transport);
      const mockReq = { method: req.method, headers: req.headers, body: JSON.parse(body || '{}') };
      await transport.handleRequest(mockReq, res, JSON.parse(body || '{}'));
    });
  });

  app.listen(port, () => {
    console.log(`\n🚀 Pixel Normal Edit MCP HTTP Server`);
    console.log(`   Endpoint : http://localhost:${port}/mcp`);
    console.log(`   Health   : http://localhost:${port}/health`);
    console.log(`   Session  : ${SESSION}`);
    console.log(`   Editor   : http://localhost:5173?mcp_session=${SESSION}`);
    console.log(`\n── AI config (paste into mcp_config.json) ──`);
    console.log(JSON.stringify({
      mcpServers: {
        'pixel-normal-edit': {
          command: 'npx',
          args: ['mcp-remote', `http://localhost:${port}/mcp`]
        }
      }
    }, null, 2));
    console.log('────────────────────────────────────────────\n');
  });
}

// ── Entry point ────────────────────────────────────────────────────────────
if (HTTP_PORT) {
  // Rebuild server factory for HTTP (stateless per-request instances)
  function buildServer() {
    // Re-use same tool registrations on a new McpServer instance
    const s = new McpServer({ name: 'PixelNormalEdit', version: '2.0.0' });
    // Copy all tools by re-running the tool() factory against the new server
    // (simplified: just re-export the whole module would be cleaner — for now proxy)
    s._tools = server._tools;
    return s;
  }
  startHttp(parseInt(HTTP_PORT)).catch(console.error);
} else {
  startStdio().catch(console.error);
}
