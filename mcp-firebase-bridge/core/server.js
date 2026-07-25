#!/usr/bin/env node
/**
 * server.js — MCP Server instance factory
 *
 * Creates and configures the McpServer instance.
 * Provides a tool registration factory for consistent tool definitions.
 */
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { sendCommand, SESSION } = require('./command-bus');
const workflow = require('../rules/workflow');
const { DRAWING_STEPS } = require('../rules/rules');

/**
 * Create a new MCP server instance
 * @returns {McpServer}
 */
function createServer() {
  return new McpServer({ name: 'PixelNormalEdit', version: '2.0.0' });
}

/**
 * Read-only tools that do not modify the canvas and should bypass strict workflow checks
 */
const READ_ONLY_TOOLS = [
  'ping', 
  'layer_get_info', 
  'workspace_list_tabs', 
  'workspace_get_active_tab', 
  'animation_get_info', 
  'anchor_list', 
  'query_snapshot', 
  'query_bounding_box', 
  'query_palette', 
  'query_pixel', 
  'query_export_image', 
  'query_document_state',
  'workflow_status',
  'workflow_get_progress'
];

/**
 * Identify if a tool is a drawing tool that should only be allowed in drawing steps
 */
function isDrawingTool(name) {
  return name.startsWith('draw_') || 
         name.startsWith('bulk_') || 
         name.startsWith('filter_') || 
         name.startsWith('sprite_') || 
         name.startsWith('region_') || 
         name.startsWith('layer_') ||
         name.startsWith('animation_') ||
         name.startsWith('art_tree_');
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
    // 1. Strict Middleware Enforcement (Run BEFORE tool execution)
    if (!READ_ONLY_TOOLS.includes(name)) {
      const state = workflow.getState(SESSION);
      
      // Allow workflow_start to run even if state is null
      if (!state && name !== 'workflow_start') {
        return { 
          isError: true, 
          content: [{ type: 'text', text: "⛔ Middleware Block: Workflow not started! Call workflow_start first." }] 
        };
      }
      
      if (state) {
        if (state.step_status === 'WAITING_FOR_USER') {
          return { 
            isError: true, 
            content: [{ type: 'text', text: "⛔ Middleware Block: Workflow is paused! Waiting for user approval. You cannot execute this tool." }] 
          };
        }
        
        if (state.step_status === 'COMPLETED') {
          return { 
            isError: true, 
            content: [{ type: 'text', text: "⛔ Middleware Block: Workflow is completed! Please start a new workflow." }] 
          };
        }

        // Block creating new tabs in EDIT_IMAGE mode
        if (name === 'workspace_create_tab' && state.current_mode === 'EDIT_IMAGE') {
          return {
            isError: true,
            content: [{ type: 'text', text: "⛔ Middleware Block: You cannot create new images in EDIT_IMAGE mode. Please only edit the existing image." }]
          };
        }

        // Check Drawing Steps Enforcement
        if (isDrawingTool(name)) {
          const currentStep = state.steps[state.currentStepIndex];
          if (!currentStep || !DRAWING_STEPS.includes(currentStep.id)) {
            return {
              isError: true,
              content: [{ type: 'text', text: `⛔ Middleware Block: You cannot use drawing/layer tools in the current step ("${currentStep ? currentStep.label : 'None'}"). You must advance to a drawing step (e.g. EXECUTE_PHASES) first.` }]
            };
          }
        }
      }
    }

    // 2. Execute the tool implementation
    const res = mapToCmd(params);
    
    // 3. If the tool implementation returns an MCP response directly (local tool like workflow_*)
    if (res && res.content) {
      return res;
    }

    // 4. Forward the command payload to the browser
    return sendCommand(res);
  });
}

module.exports = { createServer, registerTool, sendCommand };