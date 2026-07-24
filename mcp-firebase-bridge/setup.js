#!/usr/bin/env node
/**
 * setup.js — Interactive setup wizard for Pixel Normal Edit MCP
 * Run: node mcp-firebase-bridge/setup.js
 *
 * Tự động:
 *  1. Đọc Firebase config từ .env có sẵn (nếu tồn tại)
 *  2. Hỏi session ID
 *  3. Chọn chế độ: stdio hoặc HTTP
 *  4. In ra mcp_config.json đúng format để user copy
 *  5. (Tùy chọn) Ghi thẳng vào .gemini/config/mcp_config.json
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { createInterface } = require('readline');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const ROOT      = path.join(__dirname, '..');
const ENV_PATH  = path.join(ROOT, '.env');
const GEMINI_MCP = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');

function parseEnvFile(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file,'utf-8').split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const [k,...v]=l.split('='); return [k.trim(),v.join('=').trim()]; })
    );
  } catch { return {}; }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Pixel Normal Edit — MCP Setup Wizard             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── Step 1: Check .env ──────────────────────────────────────────────
  const env = parseEnvFile(ENV_PATH);
  const hasFirebase = !!(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);

  if (hasFirebase) {
    console.log('✅ Firebase config found in .env\n');
  } else {
    console.log('⚠️  No .env file found. Firebase config is required.');
    console.log('   Create a .env file with your Firebase credentials first.\n');
    console.log('   Required keys:');
    console.log('   VITE_FIREBASE_API_KEY=...');
    console.log('   VITE_FIREBASE_AUTH_DOMAIN=...');
    console.log('   VITE_FIREBASE_PROJECT_ID=...');
    console.log('   VITE_FIREBASE_STORAGE_BUCKET=...');
    console.log('   VITE_FIREBASE_MESSAGING_SENDER_ID=...');
    console.log('   VITE_FIREBASE_APP_ID=...\n');
    rl.close(); return;
  }

  // ── Step 2: Session ID ──────────────────────────────────────────────
  const sessionId = (await ask('📌 Session ID (press Enter for "my-session"): ')).trim() || 'my-session';

  // ── Step 3: Mode ─────────────────────────────────────────────────────
  console.log('\n📡 Connection mode:');
  console.log('  1. stdio  — Direct process (simplest, for Claude Desktop / Antigravity)');
  console.log('  2. HTTP   — Local server + npx mcp-remote (for any AI client)\n');
  const modeChoice = (await ask('Choose [1/2] (Enter = 1): ')).trim() || '1';
  const useHttp = modeChoice === '2';
  const httpPort = useHttp
    ? ((await ask('HTTP Port (Enter = 3456): ')).trim() || '3456')
    : null;

  // ── Step 4: Build config ─────────────────────────────────────────────
  const bridgePath = path.join(__dirname, 'index.js').replace(/\\/g, '\\\\');

  let mcpConfig;
  if (useHttp) {
    mcpConfig = {
      mcpServers: {
        'pixel-normal-edit': {
          command: 'npx',
          args: ['-y', 'mcp-remote', `http://localhost:${httpPort}/mcp`]
        }
      }
    };
  } else {
    mcpConfig = {
      mcpServers: {
        'pixel-normal-edit': {
          command: 'node',
          args: [bridgePath, sessionId],
          env: {
            MCP_SESSION: sessionId,
            MCP_TIMEOUT: '20000'
          }
        }
      }
    };
  }

  const configStr = JSON.stringify(mcpConfig, null, 2);

  // ── Step 5: Output ────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(52));
  console.log('✅ Your mcp_config.json:\n');
  console.log(configStr);
  console.log('─'.repeat(52));

  // ── Step 6: Write .agents/mcp_config.json ────────────────────────────
  const agentsDir  = path.join(ROOT, '.agents');
  const agentsFile = path.join(agentsDir, 'mcp_config.json');
  if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true });
  fs.writeFileSync(agentsFile, configStr, 'utf-8');
  console.log(`\n✅ Written to: ${agentsFile}`);

  // ── Step 7: Offer to write global Gemini config ───────────────────────
  const writeGlobal = (await ask(`\nAlso write to global Antigravity config? [y/N]: `)).trim().toLowerCase();
  if (writeGlobal === 'y') {
    try {
      // Merge with existing
      let existing = {};
      if (fs.existsSync(GEMINI_MCP)) {
        try { existing = JSON.parse(fs.readFileSync(GEMINI_MCP,'utf-8')); } catch {}
      }
      const merged = { mcpServers: { ...existing.mcpServers, ...mcpConfig.mcpServers } };
      fs.writeFileSync(GEMINI_MCP, JSON.stringify(merged,null,2), 'utf-8');
      console.log(`✅ Written to: ${GEMINI_MCP}`);
    } catch(e) {
      console.log(`⚠️  Could not write to ${GEMINI_MCP}: ${e.message}`);
      console.log('   Manually paste the config above instead.');
    }
  }

  // ── Step 8: Start instructions ────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('📋 NEXT STEPS:\n');

  if (useHttp) {
    console.log(`  1. Start HTTP server:`);
    console.log(`     node mcp-firebase-bridge/index.js --http\n`);
    console.log(`  2. Open editor:`);
    console.log(`     http://localhost:5173?mcp_session=${sessionId}\n`);
    console.log(`  3. Restart Antigravity — it will connect automatically`);
  } else {
    console.log(`  1. Open editor:`);
    console.log(`     http://localhost:5173?mcp_session=${sessionId}\n`);
    console.log(`  2. Restart Antigravity — it will connect automatically`);
  }
  console.log('\n' + '═'.repeat(52) + '\n');
  rl.close();
}

main().catch(e => { console.error('Error:', e.message); rl.close(); });
