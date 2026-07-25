#!/usr/bin/env node
/**
 * domains/art-tree/index.js — Art Tree Module Entry Point
 *
 * Main entry point for the Art Tree domain module.
 * Registers all art education tools on the MCP server.
 *
 * Architecture:
 *   shapes/   → Low-level drawing primitives
 *   lessons/  → Educational content and sequences
 *   tools/    → MCP tool definitions
 *
 * All tools are prefixed with 'art_tree_' to avoid namespace conflicts.
 */

const { registerAll: registerArtTreeTools } = require('./tools');

/**
 * Register all Art Tree MCP tools on the server
 * @param {McpServer} server
 */
function registerAll(server) {
  registerArtTreeTools(server);
}

module.exports = {
  registerAll,
};