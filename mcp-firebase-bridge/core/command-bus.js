#!/usr/bin/env node
/**
 * command-bus.js — Firebase-backed command bus for MCP
 *
 * Sends a JSON command payload to Firestore under the current session,
 * then waits for the browser editor to respond with success/error.
 */
const crypto = require('crypto');
const { doc, setDoc, onSnapshot } = require('firebase/firestore');
const { db } = require('./firebase');

const SESSION = process.argv[2] || process.env.MCP_SESSION || 'default-session';
const TIMEOUT = parseInt(process.env.MCP_TIMEOUT || '20000');

/**
 * Send a command payload to the browser via Firestore and wait for response.
 * @param {Object} payload - The command action and parameters
 * @param {number} timeoutOverride - Optional timeout in milliseconds
 * @returns {Promise<Object>} MCP-compatible response object
 */
async function sendCommand(payload, timeoutOverride = null) {
  const id = crypto.randomUUID();
  const ref = doc(db, 'mcp_sessions', SESSION, 'commands', id);
  const actualTimeout = timeoutOverride || TIMEOUT;

  await setDoc(ref, { ...payload, status: 'pending', timestamp: Date.now() });

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve({
        isError: true,
        content: [{ type: 'text', text: `⏱ Timeout (${actualTimeout}ms). Is the browser tab open with session: ${SESSION}?` }]
      });
    }, actualTimeout);

    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data();
      if (!d) return;
      if (d.status === 'success') {
        clearTimeout(timer); unsub();
        const out = d.result !== undefined ? JSON.stringify(d.result, null, 2) : '✓ Done';
        resolve({ content: [{ type: 'text', text: out }] });
      } else if (d.status === 'error') {
        clearTimeout(timer); unsub();
        resolve({ isError: true, content: [{ type: 'text', text: `❌ ${d.error}` }] });
      }
    });
  });
}

module.exports = { sendCommand, SESSION };