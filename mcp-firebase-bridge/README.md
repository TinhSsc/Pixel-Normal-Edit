# @pixel-normal-edit/mcp

> MCP (Model Context Protocol) server bridge that connects AI agents to the Pixel Normal Edit canvas in real time via Firebase Firestore.

[![npm version](https://img.shields.io/npm/v/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
[![GitHub license](https://img.shields.io/github/license/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit)
[![CI](https://github.com/TinhSsc/Pixel-Normal-Edit/actions/workflows/ci.yml/badge.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit/actions)
---

## Overview

`@pixel-normal-edit/mcp` is a standalone Node.js server that implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). It acts as a bridge between AI agents (Claude Desktop, Cursor, Windsurf, Antigravity, etc.) and the [Pixel Normal Edit](https://github.com/TinhSsc/Pixel-Normal-Edit) canvas.

Since Pixel Normal Edit runs entirely in the browser (client-side), AI agents cannot manipulate its DOM directly. This bridge solves that by using **Firebase Firestore as a real-time message bus**:

```
┌─────────────┐     MCP tools      ┌──────────────────┐    Firestore     ┌──────────────────┐
│  AI Agent   │ ──────────────────►│  @pixel-normal-  │ ────────────────►│  Pixel Normal    │
│  (Claude,   │◄──────────────────│  edit/mcp bridge  │◄────────────────│  Edit (Browser)  │
│  Cursor…)   │     MCP result     └──────────────────┘   real-time      └──────────────────┘
```

1. **AI Agent** calls an MCP tool (e.g. `draw_rect`, `query_snapshot`) via this Node.js bridge.
2. **Bridge** writes the command to Firestore under a specific Session ID.
3. **Browser** listens to that Firestore document, executes the command on the canvas, and writes the result back.
4. **Bridge** reads the result and returns it to the AI Agent.

### Use Cases

- **AI-assisted pixel art creation** — describe what you want and let the AI draw it.
- **Automated sprite generation** — script AI agents to generate tilesets or character sprites.
- **Real-time collaboration** — multiple AI agents can work on the same canvas simultaneously.
- **Testing & validation** — programmatically verify canvas state after drawing operations.

---

## Installation

### Quick Start (npx — no install required)

```bash
npx -y @pixel-normal-edit/mcp@latest YOUR_SESSION_ID
```

Replace `YOUR_SESSION_ID` with the session ID shown in Pixel Normal Edit (Settings → Account → AI Connection (MCP)).

### Local Install

```bash
npm install @pixel-normal-edit/mcp
```

Or using pnpm / yarn:

```bash
pnpm add @pixel-normal-edit/mcp
yarn add @pixel-normal-edit/mcp
```

---

## Usage

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pixel-normal-edit": {
      "command": "npx",
      "args": [
        "-y",
        "@pixel-normal-edit/mcp@latest",
        "YOUR_SESSION_ID"
      ],
      "env": {
        "DOTENV_CONFIG_QUIET": "true"
      }
    }
  }
}
```

### Cursor / Windsurf / Antigravity

Use the same `npx` command in the MCP server configuration of your IDE. The bridge communicates over `stdio` by default, which is compatible with all major MCP clients.

### HTTP Mode

For tools that require HTTP transport (e.g., `mcp-remote`):

```bash
npx -y @pixel-normal-edit/mcp@latest --http
```

This starts an HTTP server on port `3456` (configurable via `HTTP_PORT` environment variable). The endpoint is available at `http://localhost:3456/mcp`.

### Setup Wizard

The package includes an interactive setup wizard:

```bash
npx -y @pixel-normal-edit/mcp@latest --setup
```

Or if installed locally:

```bash
npm run mcp:setup
```

The wizard will:
1. Detect Firebase configuration from `.env`.
2. Prompt for a Session ID.
3. Let you choose between `stdio` and `HTTP` mode.
4. Output a ready-to-use `mcp_config.json`.
5. Optionally write it to your global Antigravity config.

---

## Available Tools

The bridge exposes **50+ native MCP tools** to AI agents, organized into categories:

### Drawing Primitives

| Tool | Description |
|---|---|
| `draw_pixel` | Set a single pixel to a color |
| `draw_erase` | Erase a single pixel (make transparent) |
| `draw_pixels_bulk` | Set multiple pixels at once (up to 5,000) |
| `draw_line` | Draw a straight line (Bresenham algorithm) |
| `draw_rect` | Draw a rectangle (outline or filled, optional rounded corners) |
| `draw_circle` | Draw a circle (outline or filled, anti-jaggy filter) |
| `draw_ellipse` | Draw an ellipse (outline or filled) |
| `draw_polygon` | Draw a polygon from a list of points |
| `draw_fill` | Flood-fill starting from a coordinate |
| `draw_gradient_rect` | Draw a rectangle filled with a smooth gradient |

### Canvas & Workspace

| Tool | Description |
|---|---|
| `canvas_get_size` | Get current canvas dimensions |
| `canvas_resize` | Resize canvas (clear, extend, or fit mode) |
| `canvas_clear` | Erase all pixels on the current frame |
| `canvas_trim` | Auto-trim transparent borders |
| `workspace_list_tabs` | List all open document tabs |
| `workspace_get_active_tab` | Get the currently active tab ID |
| `workspace_create_tab` | Create a new blank canvas tab |
| `workspace_switch_tab` | Switch to a different tab |
| `workspace_rename_tab` | Rename a tab |
| `workspace_save` | Quick-save the current workspace |

### Sprite System

| Tool | Description |
|---|---|
| `sprite_draw` | Draw a sprite using ASCII art + color palette (most efficient for complex shapes) |
| `sprite_save_stamp` | Save a named sprite for reuse across frames |
| `sprite_use_stamp` | Place a previously saved stamp at a position |
| `sprite_list_stamps` | List all saved stamp names |

### Animation

| Tool | Description |
|---|---|
| `animation_enable` | Enable or disable animation mode |
| `animation_add_frame` | Append a new blank frame |
| `animation_go_to_frame` | Switch to a specific frame |
| `animation_ensure_frame` | Ensure at least N frames exist, then switch |
| `animation_get_info` | Get frame count and active frame index |
| `animation_remove_frame` | Remove a frame |
| `animation_reorder_frame` | Move a frame to a new position |
| `animation_compare_frames` | Get pixel differences between two frames |

### Region & Bulk Operations

| Tool | Description |
|---|---|
| `region_copy` | Copy a rectangular region to internal clipboard |
| `region_paste` | Paste the clipboard region at a position |
| `region_clear` | Erase a specific rectangular region |
| `bulk_replace_color` | Replace all pixels of one color with another |
| `bulk_flood_fill_all` | Flood-fill every disconnected region of a given color |

### Query & Vision

| Tool | Description |
|---|---|
| `query_snapshot` | Get an ASCII art representation of the canvas (the AI "sees" the canvas) |
| `query_actual_bbox` | Get bounding box and pixel count for a specific object |
| `query_bounding_box` | Get bounding box of all non-transparent pixels |
| `query_palette` | Get list of all distinct colors on the canvas |
| `query_pixel` | Get the color of a specific pixel |
| `query_export_image` | Export the current frame as a base64 PNG data URL |

### Layers

| Tool | Description |
|---|---|
| `layer_get_info` | Get information about all layers |
| `layer_add` | Add a new layer |
| `layer_remove` | Remove a layer by index |
| `layer_move` | Move a layer up or down |
| `layer_clear` | Clear all pixels on a layer |
| `layer_toggle_visibility` | Toggle layer visibility |
| `layer_select` | Select active layer for drawing |

### Filters

| Tool | Description |
|---|---|
| `filter_apply` | Apply brightness, invert, grayscale, or hue-rotate filter |

### Anchors

| Tool | Description |
|---|---|
| `anchor_set` | Set a named coordinate anchor for relative drawing |
| `anchor_get` | Get position of a named anchor |
| `anchor_list` | List all named anchors |

### History & Mode

| Tool | Description |
|---|---|
| `history_undo` | Undo the last drawing action |
| `history_redo` | Redo the last undone action |
| `mode_set_mirror` | Enable/disable mirror drawing mode |
| `mode_set_onion_skin` | Enable/disable onion skin (previous frame ghost) |
| `mode_set_grid` | Show/hide the pixel grid overlay |

### Color & Health

| Tool | Description |
|---|---|
| `color_set` | Set primary and/or secondary color |
| `color_get` | Get current primary and secondary colors |
| `ping` | Check if the browser editor is connected |

---

## API Reference

### Session ID

The Session ID is a unique identifier that links the bridge to a specific browser tab running Pixel Normal Edit. It is passed as the first command-line argument:

```bash
npx @pixel-normal-edit/mcp YOUR_SESSION_ID
```

The Session ID can also be set via the `MCP_SESSION` environment variable.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MCP_SESSION` | — | Session ID (alternative to CLI argument) |
| `MCP_TIMEOUT` | `20000` | Command timeout in milliseconds |
| `HTTP_PORT` | `3456` | Port for HTTP mode |
| `DOTENV_CONFIG_QUIET` | — | Set to `true` to suppress dotenv warnings |

### Firebase Configuration

Firebase credentials are hardcoded in the bridge (API keys, project ID, etc.). This is **safe by design**:

- **API keys are routing identifiers**, not secrets. They tell the bridge which Firebase project to connect to.
- **Security is enforced by Firestore Security Rules** — only connections with a valid, unguessable Session ID (UUID) can access the `mcp_sessions` collection.
- **Zero user data access** — the bridge is restricted to its `mcp_sessions` sandbox and cannot read/write user accounts or other collections.

---

## TypeScript

This package is written in JavaScript (CommonJS) but provides full type definitions via JSDoc annotations. All tools have typed parameter schemas using [Zod](https://zod.dev/).

```ts
// TypeScript consumers can import types from the package
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
```

---

## Requirements

- **Node.js** >= 18
- **Pixel Normal Edit** browser tab open and connected to the same Firebase project
- **Firebase** project with Firestore enabled (the public Pixel Normal Edit project is used by default)

---

## Project Structure

```
mcp-firebase-bridge/
├── index.js                 # Entry point — initializes server, registers modules, starts transport
├── setup.js                 # Interactive setup wizard
├── clear-firebase.js        # Utility to clear Firestore sessions
├── core/
│   ├── firebase.js          # Firebase initialization (public config)
│   ├── server.js            # MCP server instance factory + tool registration helper
│   └── command-bus.js       # Firestore command bus (send/receive commands)
├── tools/
│   ├── index.js             # Tool registry aggregator
│   ├── canvas-tools.js      # Canvas operations
│   ├── workspace-tools.js   # Tab/workspace management
│   ├── animation-tools.js   # Animation frames
│   ├── drawing-tools.js     # Drawing primitives
│   ├── sprite-tools.js      # Sprite/stamp system
│   ├── region-tools.js      # Region clipboard
│   ├── filter-tools.js      # Visual filters
│   ├── anchor-tools.js      # Coordinate anchors
│   ├── query-tools.js       # Query & visual feedback
│   ├── history-tools.js     # Undo/redo
│   ├── mode-tools.js        # Mode settings
│   ├── color-tools.js       # Color management
│   ├── health-tools.js      # Health check
│   └── layer-tools.js       # Layer management
├── transport/
│   ├── stdio.js             # Stdio transport (for Claude Desktop, Cursor, etc.)
│   └── http.js              # HTTP transport (for mcp-remote, browser tools)
├── rules/
│   ├── index.js             # Rules module aggregator
│   ├── rules.js             # Core drawing rules & constraints
│   └── workflow.js          # Drawing workflow orchestration
├── domains/                 # Domain-specific modules (extensible)
├── package.json
└── README.md
```

### Architecture Principles

- **Minimal entry point** — `index.js` only coordinates initialization.
- **All tool logic lives in `tools/`** — each file maps to a category of MCP tools.
- **Extensible via `domains/`** — new domain modules can be added without modifying core.
- **Every tool maps 1:1 to a Firebase command-bus action** — no custom drawing logic in the bridge.
- **Naming convention**: core tools use lowercase with underscores (e.g. `draw_rect`, `query_snapshot`); domain tools use a `domain_prefix` + name.

---

## Development

### Clone & Setup

```bash
git clone https://github.com/TinhSsc/Pixel-Normal-Edit.git
cd Pixel-Normal-Edit/mcp-firebase-bridge
npm install
```

### Environment

Create a `.env` file in the project root with your Firebase configuration (if using a custom Firebase project):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> **Note**: The bridge works out of the box with the public Pixel Normal Edit Firebase project. You only need a `.env` file if you're using a custom Firebase project.

### Run

```bash
# stdio mode (default)
npm start YOUR_SESSION_ID

# HTTP mode
npm run mcp:http

# Setup wizard
npm run mcp:setup
```

### Adding a New Tool

1. Create a new file in `tools/` (e.g., `my-tools.js`).
2. Export a `register(server)` function that calls `server.tool(...)` for each tool.
3. Add the module to `tools/index.js` in the `registerAll` function.

```js
// tools/my-tools.js
const { registerTool } = require('../core/server');

function register(server) {
  registerTool(server, 'my_tool', 'Description', {
    param: z.string().describe('A parameter'),
  }, async (params) => ({
    action: 'my_tool',
    payload: params,
  }));
}

module.exports = { register };
```

---

## Security

- **Firebase API keys are public** — this is by design. They act as routing identifiers, not secrets.
- **Session IDs are unguessable UUIDs** — only someone with the correct Session ID can connect to a canvas.
- **Firestore Security Rules** enforce strict access control — the bridge can only read/write its designated `mcp_sessions` document.
- **No user data exposure** — the bridge has zero access to user accounts, authentication data, or other Firestore collections.

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Make your changes.
4. Add or update tests.
5. Ensure the bridge works end-to-end with a running Pixel Normal Edit instance.
6. Open a Pull Request.

### Before submitting a PR

- All existing tools must continue to work.
- New tools should follow the existing patterns in `tools/`.
- Tool names should use lowercase with underscores.
- Parameters should use Zod schemas with clear descriptions.
- The change should be backward-compatible where possible.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## License

This project is licensed under the [MIT License](https://github.com/TinhSsc/Pixel-Normal-Edit/blob/main/LICENSE). (The parent repository Pixel Normal Edit is MIT licensed.)

---

## Author

Created and maintained by [TinhSsc](https://github.com/TinhSsc).

## Support

- **npm**: [npmjs.com/package/@pixel-normal-edit/mcp](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
- **GitHub**: [github.com/TinhSsc/Pixel-Normal-Edit](https://github.com/TinhSsc/Pixel-Normal-Edit)
- Issues: [github.com/TinhSsc/Pixel-Normal-Edit/issues](https://github.com/TinhSsc/Pixel-Normal-Edit/issues)
- Discussions: [github.com/TinhSsc/Pixel-Normal-Edit/discussions](https://github.com/TinhSsc/Pixel-Normal-Edit/discussions)
