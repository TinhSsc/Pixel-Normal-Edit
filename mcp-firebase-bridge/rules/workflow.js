#!/usr/bin/env node
/**
 * workflow.js — Workflow Management & Drawing Metadata Logging
 *
 * Provides utilities for tracking workflow steps and logging drawing metadata.
 * Uses global Maps keyed by session ID (string) instead of setting properties
 * on the session parameter (which fails when session is a string primitive).
 */

const { SESSION } = require('../core/command-bus');

// Global stores keyed by session ID (string)
const _workflowFlags = new Map();   // sessionId -> { flag: value }
const _drawMetadata = new Map();    // sessionId -> Array<metadata>

/**
 * Log drawing metadata for tracking and validation purposes
 * @param {string} sessionId - The current session ID (string)
 * @param {string} objectId - The object identifier
 * @param {string} toolName - Name of the drawing tool used
 * @param {Object} params - Parameters of the drawing operation
 * @param {string} color - Color used in the operation
 * @param {string} milestone - Current milestone identifier
 */
function logDrawMetadata(sessionId, objectId, toolName, params, color, milestone) {
  if (!sessionId) {
    return;
  }

  const metadata = {
    objectId,
    toolName,
    params,
    color,
    milestone,
    timestamp: Date.now(),
  };

  // Store metadata in global Map keyed by session ID
  if (!_drawMetadata.has(sessionId)) {
    _drawMetadata.set(sessionId, []);
  }

  _drawMetadata.get(sessionId).push(metadata);

  // Log for debugging if needed
  if (process.env.DEBUG_WORKFLOW) {
    console.log('[Workflow] Draw metadata:', JSON.stringify(metadata, null, 2));
  }
}

/**
 * Set a workflow step flag
 * @param {string} sessionId - The current session ID (string)
 * @param {string} flag - The flag name to set
 * @param {*} value - The value to set
 */
function setStepFlag(sessionId, flag, value) {
  if (!sessionId) {
    return;
  }

  if (!_workflowFlags.has(sessionId)) {
    _workflowFlags.set(sessionId, {});
  }

  _workflowFlags.get(sessionId)[flag] = value;

  // Log for debugging if needed
  if (process.env.DEBUG_WORKFLOW) {
    console.log(`[Workflow] Set flag "${flag}" =`, value);
  }
}

/**
 * Get a workflow step flag
 * @param {string} sessionId - The current session ID (string)
 * @param {string} flag - The flag name to get
 * @returns {*} The flag value or undefined
 */
function getStepFlag(sessionId, flag) {
  if (!sessionId || !_workflowFlags.has(sessionId)) {
    return undefined;
  }

  return _workflowFlags.get(sessionId)[flag];
}

/**
 * Clear all workflow flags for a session
 * @param {string} sessionId - The current session ID (string)
 */
function clearFlags(sessionId) {
  if (sessionId) {
    _workflowFlags.delete(sessionId);
  }
}

/**
 * Get all draw metadata for an object
 * @param {string} sessionId - The current session ID (string)
 * @param {string} objectId - The object identifier
 * @returns {Array} Array of metadata entries
 */
function getDrawMetadata(sessionId, objectId) {
  if (!sessionId || !_drawMetadata.has(sessionId)) {
    return [];
  }

  const metadata = _drawMetadata.get(sessionId);

  if (objectId) {
    return metadata.filter(m => m.objectId === objectId);
  }

  return metadata;
}

module.exports = {
  logDrawMetadata,
  setStepFlag,
  getStepFlag,
  clearFlags,
  getDrawMetadata,
};