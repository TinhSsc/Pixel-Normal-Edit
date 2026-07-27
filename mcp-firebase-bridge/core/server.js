#!/usr/bin/env node
/**
 * server.js — MCP Server instance factory
 *
 * Creates and configures the McpServer instance.
 * Provides a tool registration factory for consistent tool definitions.
 */
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { sendCommand, SESSION } = require('./command-bus');

/**
 * Create a new MCP server instance
 * @returns {McpServer}
 */
function createServer() {
  return new McpServer({ name: 'PixelNormalEdit', version: '2.0.0' });
}

/**
 * Register a single-command tool on the server
 * @param {McpServer} server - The MCP server instance
 * @param {string} name - Tool name
 * @param {string} desc - Tool description
 * @param {Object} schema - Zod schema for parameters
 * @param {Function} mapToCmd - Function mapping params to command payload or returning MCP response
 */
function registerTool(server, name, desc, schema, mapToCmd) {
  server.tool(name, desc, schema, async (params) => {
    // Execute the tool implementation
    const res = await mapToCmd(params);
    
    // If the tool implementation returns an MCP response directly (local tool)
    if (res && res.content) {
      return res;
    }

    // Forward the command payload to the browser
    return sendCommand(res);
  });
}

module.exports = { createServer, registerTool, sendCommand };