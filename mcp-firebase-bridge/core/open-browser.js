#!/usr/bin/env node
/**
 * core/open-browser.js — Open a URL in the user's default browser
 *
 * Cross-platform browser opener used to automatically bring up the
 * Pixel Normal Edit web app when the editor tab is not connected.
 *
 * Windows  → `start <url>`
 * macOS    → `open <url>`
 * Linux    → `xdg-open <url>`
 */
const { exec } = require('child_process');

/**
 * Open a URL in the system default browser.
 * @param {string} url - The URL to open
 * @returns {Promise<boolean>} resolves true if the open command was launched
 */
function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  return new Promise((resolve) => {
    exec(command, (error) => {
      if (error) {
        console.warn(`[open-browser] Failed to open ${url}: ${error.message}`);
        resolve(false);
      } else {
        console.log(`[open-browser] Opened: ${url}`);
        resolve(true);
      }
    });
  });
}

/**
 * Build the web app URL for a given session, using the session's
 * last known currentUrl when available, otherwise the configured
 * fallback (defaults to the Vercel deployment).
 * @param {string} sessionId - The MCP session ID
 * @returns {string}
 */
function buildEditorUrl(sessionId) {
  const base = process.env.MCP_WEB_URL || 'https://pixel-normal-edit.vercel.app';
  return `${base}/?mcp_session=${sessionId}`;
}

module.exports = { openBrowser, buildEditorUrl };