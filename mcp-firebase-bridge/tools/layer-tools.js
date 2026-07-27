#!/usr/bin/env node
/**
 * layer-tools.js — MCP Tool Registration for Layers
 *
 * Exposes the layer management functionality to MCP clients.
 */
const { z } = require('zod');
const { registerTool, sendCommand } = require('../core/server');

/**
 * Register all layer tools on the MCP server.
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'layer_get_info',
    'Get information about all current layers and the active layer index.',
    {},
    async () => {
      const activeRes = await sendCommand({ action: 'layer.getActiveLayerIndex' });
      const layersRes = await sendCommand({ action: 'layer.getLayers' });
      return { 
        content: [{ 
          type: 'text', 
          text: JSON.stringify({ 
            activeLayerIndex: activeRes.result, 
            layers: layersRes.result 
          }, null, 2)
        }] 
      };
    });

  registerTool(server, 'layer_add',
    'Add a new layer on top of existing layers.',
    {},
    async () => {
      await sendCommand({ action: 'layer.add' });
      return { content: [{ type: 'text', text: '✓ New layer added.' }] };
    });

  registerTool(server, 'layer_remove',
    'Remove a layer by its index.',
    { index: z.number().int().describe('The index of the layer to remove (0 is the bottom-most)') },
    async (p) => {
      await sendCommand({ action: 'layer.remove', index: p.index });
      return { content: [{ type: 'text', text: `✓ Layer ${p.index} removed.` }] };
    });

  registerTool(server, 'layer_move',
    'Move a layer up or down in the stack.',
    { 
      index: z.number().int().describe('The index of the layer to move'),
      direction: z.enum(['up', 'down']).describe('Direction to move the layer')
    },
    async (p) => {
      if (p.direction === 'up') {
        await sendCommand({ action: 'layer.moveUp', index: p.index });
      } else {
        await sendCommand({ action: 'layer.moveDown', index: p.index });
      }
      return { content: [{ type: 'text', text: `✓ Layer ${p.index} moved ${p.direction}.` }] };
    });

  registerTool(server, 'layer_clear',
    'Clear all pixels and evidence on a specific layer without removing the layer itself.',
    { index: z.number().int().describe('The index of the layer to clear') },
    async (p) => {
      await sendCommand({ action: 'layer.clear', index: p.index });
      return { content: [{ type: 'text', text: `✓ Layer ${p.index} cleared.` }] };
    });

  registerTool(server, 'layer_toggle_visibility',
    'Toggle the visibility of a layer by its index.',
    { index: z.number().int().describe('The index of the layer to toggle') },
    async (p) => {
      await sendCommand({ action: 'layer.toggle', index: p.index });
      return { content: [{ type: 'text', text: `✓ Toggled visibility of layer ${p.index}.` }] };
    });

  registerTool(server, 'layer_select',
    'Select an active layer for drawing operations.',
    { index: z.number().int().describe('The index of the layer to select') },
    async (p) => {
      await sendCommand({ action: 'layer.select', index: p.index });
      return { content: [{ type: 'text', text: `✓ Selected layer ${p.index}.` }] };
    });
}

module.exports = { register };