#!/usr/bin/env node
/**
 * tool-register.js — Art Tree: Tool Registration Helpers
 *
 * Provides helper functions to reduce boilerplate when registering
 * Art Tree MCP tools. Common patterns are abstracted here.
 */

const { z } = require('zod');
const { registerTool, sendCommand } = require('../../core/server');
const { hexColor, canvasSize } = require('./validators');

/**
 * Register a lesson tool with standard pattern
 * @param {McpServer} server - MCP server instance
 * @param {string} name - Tool name
 * @param {string} description - Tool description
 * @param {Function} lessonFn - Function that returns array of commands
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.canvasSizeMax=64] - Max canvas size
 * @param {string} [options.defaultColor] - Default color (uses hexColor default if not provided)
 */
function registerLessonTool(server, name, description, lessonFn, options = {}) {
  const { canvasSizeMax = 64, defaultColor } = options;
  
  const schema = {
    canvasSize: canvasSize.max(canvasSizeMax),
  };
  
  if (defaultColor) {
    schema.color = hexColor.default(defaultColor);
  }
  
  registerTool(server, name, description, schema, async (params) => {
    const commands = lessonFn(params.canvasSize, params.color || defaultColor);
    await Promise.all(commands.map(cmd => sendCommand(cmd)));
    return { 
      content: [{ 
        type: 'text', 
        text: `✓ ${description.split(' — ')[0]} completed (${commands.length} strokes)` 
      }] 
    };
  });
}

/**
 * Register a catalog tool that returns a list of available lessons
 * @param {McpServer} server - MCP server instance
 * @param {string} name - Tool name
 * @param {string} description - Tool description
 * @param {Function} getCatalogFn - Function that returns catalog array
 * @param {string} catalogTitle - Title for the catalog output
 */
function registerCatalogTool(server, name, description, getCatalogFn, catalogTitle) {
  registerTool(server, name, description, {}, () => {
    const catalog = getCatalogFn();
    const text = catalog.map(l =>
      `  • ${l.id}: ${l.name} — ${l.description}`
    ).join('\n');
    return { content: [{ type: 'text', text: `📚 ${catalogTitle}:\n\n${text}` }] };
  });
}

/**
 * Register a tool that executes a specific lesson step
 * @param {McpServer} server - MCP server instance
 * @param {string} name - Tool name
 * @param {string} description - Tool description
 * @param {Function} lessonStepFn - Function that takes step number and returns commands
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.minStep=1] - Minimum step number
 * @param {number} [options.maxStep=10] - Maximum step number
 * @param {number} [options.canvasSizeMax=64] - Max canvas size
 * @param {string} [options.defaultColor] - Default color
 */
function registerStepTool(server, name, description, lessonStepFn, options = {}) {
  const { minStep = 1, maxStep = 10, canvasSizeMax = 64, defaultColor } = options;
  
  const schema = {
    canvasSize: canvasSize.max(canvasSizeMax),
    step: z.number().int().min(minStep).max(maxStep).describe('Step number'),
  };
  
  if (defaultColor) {
    schema.color = hexColor.default(defaultColor);
  }
  
  registerTool(server, name, description, schema, async (params) => {
    const commands = lessonStepFn(params.canvasSize, params.step, params.color || defaultColor);
    await Promise.all(commands.map(cmd => sendCommand(cmd)));
    return { 
      content: [{ 
        type: 'text', 
        text: `✓ ${description.split(' — ')[0]} - Step ${params.step} completed` 
      }] 
    };
  });
}

module.exports = {
  registerLessonTool,
  registerCatalogTool,
  registerStepTool,
};