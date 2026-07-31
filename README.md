# Pixel Normal Edit

> A high-performance, browser-based pixel art editor and image tool suite built for game developers and pixel artists who demand speed and precision.

[![GitHub license](https://img.shields.io/github/license/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fpixel-normal-edit.web.app%2F&label=Live%20Demo)](https://pixel-normal-edit.web.app/)

---

## Overview

Pixel Normal Edit is a specialized pixel art editor that runs entirely in the browser. It combines low-level memory optimizations (flat buffers, typed arrays) with GPU-accelerated rendering to deliver smooth, responsive editing even on canvases with millions of pixels. Alongside the editor, it bundles a suite of [image tools](#-image-tool-suite) (convert, compress, resize, crop, rotate, GIF/video utilities) that run 100% client-side.

It is designed for:

- **Game developers** creating sprite sheets, tilesets, and 8/16-bit game assets.
- **Pixel artists** who need a fast, focused tool without the overhead of desktop software.
- **AI-assisted workflows** — the editor connects to AI agents via the MCP bridge, allowing AI to draw on the canvas in real time.

### Why Pixel Normal Edit?

| Problem | Solution |
|---|---|
| Slow rendering on large canvases | [`Uint32Array` flat buffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array) linked directly to `ImageData` — zero-copy blitting |
| Grid rendering chokes CPU | CSS `linear-gradient` grid delegated to GPU |
| Flood fill freezes UI | Offloaded to a Web Worker (background thread) |
| Heavy desktop software overhead | Runs in any modern browser — no install required |
| AI can't see or draw on canvas | [Firebase MCP bridge](mcp-firebase-bridge/) exposes canvas to AI agents via Model Context Protocol |

---

## Features

### Pixel Editor

- **High-performance pixel rendering** — 32-bit flat buffer linked to `ImageData.data.buffer` for O(1) pixel access and sub-millisecond canvas blitting.
- **GPU-accelerated grid** — CSS `background-image` with `linear-gradient` runs grid rendering on the GPU, maintaining smooth 60 FPS zoom/pan.
- **Web Workers** — Flood fill, magic eraser, and other expensive algorithms run off the main thread.
- **Undo / Redo** — Full history management with chunked async processing.
- **Custom canvas sizes** — from tiny sprites to large canvases, with aspect-ratio presets (1:1, 16:9, 4:3, …).
- **Layer support** — add, remove, reorder, hide, and lock layers.
- **Animation frames** — Multi-frame animation with onion skin preview and GIF export.
- **Image import/export** — PNG, JPEG, WebP, GIF and more, with compression options.
- **Advanced tools** — pencil, brush, line, rectangle, circle, ellipse, polygon, text, gradient fill, flood fill, magic eraser, selection, mirror mode.
- **Reference images** — add background images (with strict controls to prevent AI conflicts).

### Image Tool Suite

All tools run entirely in the browser — images never leave the device.

| Tool | Description |
|---|---|
| [Convert](https://pixel-normal-edit.web.app/?tool=convert) | Convert between PNG, WebP, AVIF, JPG and other formats |
| [Compress](https://pixel-normal-edit.web.app/?tool=compress) | Reduce file size 60–90% (lossy & lossless) |
| [Resize](https://pixel-normal-edit.web.app/?tool=resize) | Resize freely, by ratio, or using common presets |
| [Crop](https://pixel-normal-edit.web.app/?tool=crop) | Crop with ratio presets (1:1, 16:9, 4:3, …) |
| [Rotate / Flip](https://pixel-normal-edit.web.app/?tool=rotate) | Rotate at any angle, flip horizontally/vertically |
| [Frames → GIF / Video](https://pixel-normal-edit.web.app/?tool=frames-to-media) | Combine images into GIF or WebM, convert between GIF and video |
| [GIF / Video → Frames](https://pixel-normal-edit.web.app/?tool=media-to-frames) | Split GIF/video frames into individual images |
| [Simplify GIF / Speed-up video](https://pixel-normal-edit.web.app/?tool=gif-simplify) | Drop frames to shrink GIFs or speed up videos |

### General

- **AI Integration** — Connect AI agents via the MCP bridge for assisted drawing.
- **Multi-language** — Vietnamese and English (extensible via dictionary files).
- **Themes** — Dark, light, and customizable accent colors.
- **Cloud storage** — Sign in with Google to save workspaces to Google Drive.

---

## Performance Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                        │
├─────────────────────────────────────────────────────────┤
│                   Canvas 2D API                          │
│          (ImageData ← Uint32Array buffer)                │
├─────────────────────┬───────────────────────────────────┤
│  CSS Grid (GPU)     │  Web Worker (Flood Fill, etc.)    │
├─────────────────────┴───────────────────────────────────┤
│  MCP Bridge ← Firestore ← AI Agent (Claude, etc.)      │
└─────────────────────────────────────────────────────────┘
```

Key optimizations:

- **Memory**: Colors stored as `uint32` (`0xAARRGGBB`) instead of `'#RRGGBB'` strings — reduces RAM by ~90% and eliminates GC pressure.
- **Rendering**: `ImageData.data.buffer` is shared with the `Uint32Array` — painting the canvas is a single `putImageData` call, not a loop of `fillRect`s.
- **Grid**: Virtual grid via CSS on an overlay `<div>` — no canvas redraw needed when zooming/panning.
- **Async chunky processing**: Large operations (clear, fill, replace) are split into chunks interleaved with `requestAnimationFrame` to keep the UI responsive.

---

## AI Integration (MCP Bridge)

Pixel Normal Edit supports AI-driven drawing through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). The [`@pixel-normal-edit/mcp`](https://www.npmjs.com/package/@pixel-normal-edit/mcp) package acts as a bridge between AI agents (Claude Desktop, Cursor, Windsurf, Antigravity) and the canvas via Firebase Firestore.

[![npm version](https://img.shields.io/npm/v/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)

```
┌─────────────┐     MCP tools      ┌──────────────────┐    Firestore     ┌──────────────────┐
│  AI Agent   │ ──────────────────►│  @pixel-normal-  │ ────────────────►│  Pixel Normal    │
│  (Claude,   │◄──────────────────│  edit/mcp bridge  │◄────────────────│  Edit (Browser)  │
│  Cursor…)   │     MCP result     └──────────────────┘   real-time      └──────────────────┘
```

### Quick Start (for AI users)

```bash
npx -y @pixel-normal-edit/mcp@latest YOUR_SESSION_ID
```

Get your Session ID from **Pixel Normal Edit → Settings → Account → AI Connection (MCP)**.

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "pixel-normal-edit": {
      "command": "npx",
      "args": ["-y", "@pixel-normal-edit/mcp@latest", "YOUR_SESSION_ID"],
      "env": { "DOTENV_CONFIG_QUIET": "true" }
    }
  }
}
```

### Available Tools (50+)

| Category | Tools |
|---|---|
| Drawing | `draw_pixel`, `draw_line`, `draw_rect`, `draw_circle`, `draw_ellipse`, `draw_polygon`, `draw_fill`, `draw_gradient_rect`, `draw_pixels_bulk` |
| Canvas | `canvas_get_size`, `canvas_resize`, `canvas_clear`, `canvas_trim` |
| Workspace | `workspace_list_tabs`, `workspace_create_tab`, `workspace_switch_tab`, `workspace_save` |
| Sprite | `sprite_draw`, `sprite_save_stamp`, `sprite_use_stamp`, `sprite_list_stamps` |
| Animation | `animation_add_frame`, `animation_go_to_frame`, `animation_compare_frames`, `animation_reorder_frame` |
| Region | `region_copy`, `region_paste`, `region_clear`, `bulk_replace_color`, `bulk_flood_fill_all` |
| Query | `query_snapshot` (ASCII vision), `query_palette`, `query_bounding_box`, `query_pixel`, `query_export_image` |
| Layers | `layer_add`, `layer_remove`, `layer_move`, `layer_select`, `layer_toggle_visibility` |
| Filters | `filter_apply` (brightness, invert, grayscale, hue-rotate) |
| History | `history_undo`, `history_redo` |
| Modes | `mode_set_mirror`, `mode_set_onion_skin`, `mode_set_grid` |

See the [MCP Bridge README](mcp-firebase-bridge/README.md) for full documentation, HTTP mode, setup wizard, and development guide.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/), [Vite 8](https://vite.dev/) |
| Rendering | HTML5 Canvas 2D API + CSS GPU-accelerated grid |
| Data | [`Uint32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array) — colors encoded as 32-bit integers |
| Image processing | [@imagemagick/magick-wasm](https://www.npmjs.com/package/@imagemagick/magick-wasm), [browser-image-compression](https://www.npmjs.com/package/browser-image-compression), [gif.js](https://www.npmjs.com/package/gif.js), [gifenc](https://www.npmjs.com/package/gifenc), [gifuct-js](https://www.npmjs.com/package/gifuct-js), [JSZip](https://www.npmjs.com/package/jszip) |
| i18n | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) |
| Backend | [Firebase](https://firebase.google.com/) (Auth + Firestore + Hosting) |
| AI Bridge | [MCP](https://modelcontextprotocol.io/) — [`@pixel-normal-edit/mcp`](https://www.npmjs.com/package/@pixel-normal-edit/mcp) |
| Panel UI | [DockView React](https://dockview.dev/) |
| Icons | [Lucide](https://lucide.dev/) |
| Linting | [oxlint](https://oxc.rs/) |

---

## Project Structure

```
.
├── src/                        # Web app source
│   ├── app/                    # App entry, routing (editor + tools)
│   ├── features/
│   │   ├── editor/             # Pixel art editor (engine, tools, io, ui)
│   │   ├── mini-tools/         # Image tool suite (convert, compress, …)
│   │   ├── auth/               # Google authentication
│   │   ├── settings/           # Global settings modal
│   │   └── storage/            # Google Drive integration
│   ├── i18n/                   # Vietnamese + English dictionaries
│   └── shared/                 # Shared UI, icons, config, utilities
├── public/                     # Static assets (logo, SEO, robots, sitemap)
├── mcp-firebase-bridge/        # MCP server for AI integration (published as @pixel-normal-edit/mcp)
├── .github/workflows/          # CI/CD — Firebase Hosting deploy (merge + PR preview)
├── .env.example                # Environment variable template
├── firebase.json               # Firebase Hosting + Firestore rules config
├── firestore.rules             # Firestore security rules
├── package.json
└── vite.config.js
```

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Make your changes.
4. Add or update tests if applicable.
5. Open a Pull Request.

### Before submitting a PR

- All existing functionality must continue to work.
- Code should follow the existing patterns (flat buffer, typed arrays for performance-critical paths).
- New features should be backward-compatible where possible.
- UI changes should respect the [design system](DESIGN.md).
- Run the linter: `npm run lint`.

---

## License

This project is licensed under the [MIT License](LICENSE).

## Author

Created and maintained by [TinhSsc](https://github.com/TinhSsc).

## Support

- **Live demo**: [pixel-normal-edit.web.app](https://pixel-normal-edit.web.app/)
- **npm**: [npmjs.com/package/@pixel-normal-edit/mcp](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
- **GitHub**: [github.com/TinhSsc/Pixel-Normal-Edit](https://github.com/TinhSsc/Pixel-Normal-Edit)
- Issues: [github.com/TinhSsc/Pixel-Normal-Edit/issues](https://github.com/TinhSsc/Pixel-Normal-Edit/issues)
- Discussions: [github.com/TinhSsc/Pixel-Normal-Edit/discussions](https://github.com/TinhSsc/Pixel-Normal-Edit/discussions)
