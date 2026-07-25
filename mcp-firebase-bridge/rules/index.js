#!/usr/bin/env node
/**
 * rules/index.js — Rules Module Aggregator
 *
 * Aggregates and exports all rules, workflow engine, and prerequisite tools.
 *
 * This module provides:
 *   1. rules.js         — Defines rules (naming, constraints, validators)
 *   2. workflow.js      — Workflow engine (manages step order)
 *   3. prerequisites.js — MCP Tools for workflow (start, status, advance, validate)
 *
 * How to add a new rule:
 *   - Add to rules.js (NAMING_RULES, WORKFLOW_STEPS, DRAWING_CONSTRAINTS)
 *   - If complex logic is needed, create a new file in rules/ and import it here
 */

const rules = require('./rules');
const workflow = require('./workflow');
const prerequisites = require('./prerequisites');

/**
 * Register all workflow/prerequisite tools to the MCP server
 * @param {McpServer} server
 */
function registerAll(server) {
  prerequisites.register(server);
}

module.exports = {
  rules,
  workflow,
  prerequisites,
  registerAll,
};