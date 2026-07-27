#!/usr/bin/env node
/**
 * workspace-tools.js — Workspace / Tabs tools
 *
 * Tools: workspace_list_tabs, workspace_get_active_tab, workspace_create_tab,
 *        workspace_switch_tab, workspace_rename_tab, workspace_save
 */
const { z } = require('zod');
const { registerTool, sendCommand } = require('../core/server');

function register(server) {
  registerTool(server, 'workspace_list_tabs',
    'List all open document tabs with their IDs and names',
    {},
    () => ({ action: 'listTabs' }));

  registerTool(server, 'workspace_get_active_tab',
    'Get the currently active tab ID',
    {},
    () => ({ action: 'getActiveTabId' }));

  registerTool(server, 'workspace_create_tab',
    'Create a new blank canvas tab',
    {
      name: z.string().optional().describe('Tab name'),
      width: z.number().int().min(1).max(256).optional().describe('Canvas width (max 256)'),
      height: z.number().int().min(1).max(256).optional().describe('Canvas height (max 256)')
    },
    async (p) => {
      // If width/height are missing, the web client will use default sizes, and the AI can resize later.
      return { action: 'createTab', ...p };
    }
  );

  registerTool(server, 'workspace_switch_tab',
    'Switch to a different tab by ID (get IDs from workspace_list_tabs)',
    { tabId: z.string().describe('Tab ID to switch to') },
    (p) => ({ action: 'switchTab', tabId: p.tabId }));

  registerTool(server, 'workspace_rename_tab',
    'Rename a tab',
    { tabId: z.string(), name: z.string() },
    (p) => ({ action: 'renameTab', ...p }));

  registerTool(server, 'workspace_save',
    'Quick-save the current workspace',
    {},
    () => ({ action: 'quickSave' }));
}

module.exports = { register };