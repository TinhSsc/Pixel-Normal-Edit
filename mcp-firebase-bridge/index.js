#!/usr/bin/env node
/**
 * MCP Firebase Bridge v3 — Modular Architecture
 * ============================================================================
 * Entry point for the Pixel Normal Edit MCP server.
 *
 * Architecture:
 *   index.js          → Entry point: initializes server, registers modules, starts transport
 *   core/             → Firebase, command bus, server factory
 *   tools/            → Core tools (canvas, workspace, animation, drawing, etc.)
 *   transport/        → stdio and HTTP transports
 *   domains/          → Domain-specific modules (art-tree, etc.)
 *
 * Design principles:
 *   - index.js is kept minimal — it only coordinates initialization
 *   - All tool logic lives in tools/ and domains/
 *   - New domains can be added as folders in domains/ without modifying core
 *   - Every tool maps 1:1 to a Firebase command-bus action
 *   - No custom drawing logic — all drawing uses existing primitives
 *
 * Module naming convention:
 *   - Core tools: lowercase with underscores (e.g. draw_rect, query_snapshot)
 *   - Domain tools: domain_prefix + name (e.g. art_tree_draw_square)
 * ============================================================================
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createServer } = require('./core/server');
const { registerAll: registerCoreTools } = require('./tools/index');
const { registerAll: registerArtTree } = require('./domains/art-tree/index');
const { registerAll: registerRules } = require('./rules/index');

// ── Initialize ────────────────────────────────────────────────────────────
const server = createServer();

// ── Register Core Tools ───────────────────────────────────────────────────
registerCoreTools(server);

// ── Register Rules / Workflow Tools (BẮT BUỘC: chạy trước khi vẽ) ────────
registerRules(server);

// ── Register Domain Modules ───────────────────────────────────────────────
registerArtTree(server);
// Future domains: registerPixelArt(server), registerCharacterDrawing(server), etc.

// ── Start Transport ───────────────────────────────────────────────────────
const HTTP_PORT = process.env.HTTP_PORT || (process.argv.includes('--http') ? 3456 : null);

if (HTTP_PORT) {
  require('./transport/http').start(parseInt(HTTP_PORT)).catch(console.error);
} else {
  require('./transport/stdio').start(server).catch(console.error);
}