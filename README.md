# Pixel Normal Edit

> A high-performance, browser-based pixel art editor designed for game developers and pixel artists who demand speed and precision.

[![npm version](https://img.shields.io/npm/v/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@pixel-normal-edit/mcp.svg)](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
[![GitHub license](https://img.shields.io/github/license/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/TinhSsc/Pixel-Normal-Edit.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit)
[![CI](https://github.com/TinhSsc/Pixel-Normal-Edit/actions/workflows/ci.yml/badge.svg)](https://github.com/TinhSsc/Pixel-Normal-Edit/actions)

## Overview

Pixel Normal Edit is a specialized pixel art editor that runs entirely in the browser. It combines low-level memory optimizations (flat buffers, typed arrays) with GPU-accelerated rendering to deliver smooth, responsive editing even on canvases with millions of pixels.

It is designed for:

- **Game developers** creating sprite sheets, tilesets, and 8/16-bit game assets.
- **Pixel artists** who need a fast, focused tool without the overhead of desktop software.
- **AI-assisted workflows** — the editor connects to AI agents via the [MCP Bridge](mcp-firebase-bridge/), allowing AI to draw on the canvas in real time.

### Why Pixel Normal Edit?

| Problem | Solution |
|---|---|
| Slow rendering on large canvases | [`Uint32Array` flat buffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array) linked directly to `ImageData` — zero-copy blitting |
| Grid rendering chokes CPU | CSS `linear-gradient` grid delegated to GPU |
| Flood fill freezes UI | Offloaded to a Web Worker (background thread) |
| Heavy desktop software overhead | Runs in any modern browser — no install required |
| AI can't see or draw on canvas | [Firebase MCP bridge](mcp-firebase-bridge/) exposes canvas to AI agents via Model Context Protocol |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/), [Vite 8](https://vite.dev/) |
| Rendering | HTML5 Canvas 2D API + CSS GPU-accelerated grid |
| Data | [`Uint32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array) — colors encoded as 32-bit integers |
| i18n | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) |
| Backend | [Firebase](https://firebase.google.com/) (Auth + Firestore) |
| AI Bridge | [MCP](https://modelcontextprotocol.io/) — `@pixel-normal-edit/mcp` Node.js server |
| Panel UI | [DockView React](https://dockview.dev/) |
| Linting | [oxlint](https://oxc.rs/) |

## Features

- **High-performance pixel rendering** — 32-bit flat buffer linked to `ImageData.data.buffer` for O(1) pixel access and sub-millisecond canvas blitting.
- **GPU-accelerated grid** — CSS `background-image` with `linear-gradient` runs grid rendering on the GPU, maintaining smooth 60 FPS zoom/pan.
- **Web Workers** — Flood fill, magic eraser, and other expensive algorithms run off the main thread.
- **Undo / Redo** — Full history management with chunked async processing.
- **Custom canvas sizes** — 8×8 up to 256×256.
- **Layer support** — Up to 32 layers.
- **Animation frames** — Multi-frame animation with onion skin preview.
- **Image export** — PNG, JPEG, WebP with compression options.
- **AI Integration** — Connect AI agents via the MCP bridge for assisted drawing.
- **Multi-language** — Vietnamese and English (extensible via dictionary files).
- **Dark theme** — Professional dark UI with customizable accent colors.
- **Background image** — Add reference images (with strict controls to prevent AI conflicts).

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

## Quick Start

### Prerequisites

- Node.js >= 18
- npm (or pnpm / yarn)

### Setup

```bash
# Clone the repository
git clone https://github.com/TinhSsc/Pixel-Normal-Edit.git
cd Pixel-Normal-Edit

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the URL displayed in the terminal (usually [http://localhost:5173](http://localhost:5173)).

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
.
├── public/                  # Static assets (favicon, icons)
├── src/
│   ├── app/                 # App entry point (main.jsx, App.jsx)
│   ├── assets/              # Images, icons
│   ├── features/
│   │   ├── auth/            # Firebase Authentication
│   │   ├── editor/          # Core pixel editor logic
│   │   ├── settings/        # User settings
│   │   └── storage/         # Cloud save/load
│   ├── i18n/                # Internationalization (vi, en)
│   ├── shared/
│   │   ├── dom/             # DOM utilities
│   │   ├── lib/             # Shared libraries
│   │   ├── styles/          # Shared CSS
│   │   └── ui/              # Reusable UI components
│   └── styles/              # Global styles
├── mcp-firebase-bridge/     # MCP server for AI integration
├── index.html
├── vite.config.js
└── package.json
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### AI Integration (MCP Bridge)

The MCP bridge (`mcp-firebase-bridge/`) allows AI agents to read and draw on the canvas in real time. See the [MCP Bridge README](mcp-firebase-bridge/README.md) for setup instructions.

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Make your changes.
4. Add or update tests if applicable.
5. Ensure lint passes (`npm run lint`).
6. Open a Pull Request.

### Before submitting a PR

- All existing functionality must continue to work.
- Code should follow the existing patterns (flat buffer, typed arrays for performance-critical paths).
- New features should be backward-compatible where possible.
- UI changes should respect the [design system](DESIGN.md).

## Roadmap

- [ ] Additional brush types (dither, pattern)
- [ ] Tilemap export (Tiled JSON format)
- [ ] Collaborative real-time editing
- [ ] Plugin / extension system
- [ ] More export formats (GIF, sprite sheet)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

Created and maintained by [TinhSsc](https://github.com/TinhSsc).

## Support

- **npm**: [npmjs.com/package/@pixel-normal-edit/mcp](https://www.npmjs.com/package/@pixel-normal-edit/mcp)
- **GitHub**: [github.com/TinhSsc/Pixel-Normal-Edit](https://github.com/TinhSsc/Pixel-Normal-Edit)
- Issues: [github.com/TinhSsc/Pixel-Normal-Edit/issues](https://github.com/TinhSsc/Pixel-Normal-Edit/issues)
- Discussions: [github.com/TinhSsc/Pixel-Normal-Edit/discussions](https://github.com/TinhSsc/Pixel-Normal-Edit/discussions)
