#!/usr/bin/env node
/**
 * transport/stdio.js — Stdio transport for MCP server
 *
 * Connects the server to standard input/output for use with
 * Claude Desktop, Cursor, Windsurf, and other stdio-based MCP clients.
 */
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

/**
 * Start the MCP server using the stdio transport
 * @param {McpServer} server - The configured MCP server instance
 */
async function start(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Console.error output is suppressed to avoid JSON parsing issues
  // with MCP clients that merge stdout and stderr.
}

module.exports = { start };