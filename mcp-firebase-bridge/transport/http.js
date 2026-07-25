#!/usr/bin/env node
/**
 * transport/http.js — HTTP transport for MCP server
 *
 * Starts an HTTP server that accepts MCP requests at /mcp.
 * Supports CORS for browser tools, health checks at /health.
 * Each HTTP request gets its own transport instance (stateless).
 */
const http = require('http');
const crypto = require('crypto');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { registerAll } = require('../tools/index');
const { SESSION } = require('../core/command-bus');

/**
 * Build a fresh MCP server instance (used per HTTP request)
 * @returns {McpServer}
 */
function buildServer() {
  const { createServer } = require('../core/server');
  const s = createServer();
  registerAll(s);
  return s;
}

/**
 * Start the MCP server as an HTTP server on the given port
 * @param {number} port - HTTP port to listen on
 */
async function start(port) {
  const app = http.createServer(async (req, res) => {
    // CORS for browser tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, session: SESSION, ts: Date.now() }));
      return;
    }

    if (req.url !== '/mcp') {
      res.writeHead(404); res.end('Use /mcp'); return;
    }

    // Read body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        enableJsonResponse: true,
      });
      const freshServer = buildServer();
      await freshServer.connect(transport);
      await transport.handleRequest(
        { method: req.method, headers: req.headers, body: JSON.parse(body || '{}') },
        res,
        JSON.parse(body || '{}')
      );
    });
  });

  app.listen(port, () => {
    console.log(`\nPixel Normal Edit MCP HTTP Server`);
    console.log(`   Endpoint : http://localhost:${port}/mcp`);
    console.log(`   Health   : http://localhost:${port}/health`);
    console.log(`   Session  : ${SESSION}`);
    console.log(`   Editor   : http://localhost:5173?mcp_session=${SESSION}`);
    console.log(`\n── AI config (paste into mcp_config.json) ──`);
    console.log(JSON.stringify({
      mcpServers: {
        'pixel-normal-edit': {
          command: 'npx',
          args: ['mcp-remote', `http://localhost:${port}/mcp`]
        }
      }
    }, null, 2));
    console.log('────────────────────────────────────────────\n');
  });
}

module.exports = { start };