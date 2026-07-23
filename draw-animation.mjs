/**
 * Animation demo: dùng tất cả tính năng mới của command-bus
 * drawSprite + copyRegion + querySnapshot + exportBase64
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
const parseEnv = (k) => { const m = envContent.match(new RegExp(k + '=(.*)')); return m ? m[1].trim() : ''; };

const app = initializeApp({
  apiKey: parseEnv('VITE_FIREBASE_API_KEY'),
  authDomain: parseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: parseEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: parseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: parseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: parseEnv('VITE_FIREBASE_APP_ID')
});
const db = getFirestore(app);
const SESSION = 'f0e039be-0f7d-46dd-a70f-c413e87ecd79';

async function cmd(data, timeout = 15000) {
  const id = Math.random().toString(36).slice(2) + Date.now();
  const ref = doc(db, `mcp_commands_${SESSION}`, id);
  await setDoc(ref, { ...data, status: 'pending', timestamp: Date.now() });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { unsub(); reject(new Error(`Timeout: ${data.action}`)); }, timeout);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data();
      if (d?.status === 'success') { clearTimeout(t); unsub(); resolve(d.result ?? {}); }
      else if (d?.status === 'error') { clearTimeout(t); unsub(); reject(new Error(d.error)); }
    });
  });
}

// ── Palette ──────────────────────────────────────────────────────────────
const P = {
  '.': null,       // transparent
  'S': '#87ceeb',  // sky
  'G': '#4caf50',  // grass
  'D': '#795548',  // dirt
  'T': '#5d4037',  // tree trunk
  'L': '#2e7d32',  // leaf dark
  'l': '#43a047',  // leaf light
  'k': '#ffcc99',  // skin
  'H': '#3e2723',  // hair
  'b': '#1565c0',  // shirt blue
  'p': '#263238',  // pants dark
  's': '#212121',  // shoe black
  'A': '#9e9e9e',  // axe metal
  'h': '#8d6e63',  // axe handle
  'u': '#ffe066',  // sun
  'w': '#bcaaa4',  // wood chip/stump
};

// ── Background (64×32 sky + 32×32 ground — hàng top) ─────────────────────
// We draw background row by row using drawRect (faster than per-pixel)
async function drawBg() {
  // Sky
  await cmd({ action: 'drawRect', x: 0, y: 0, w: 64, h: 46, color: '#87ceeb', filled: true });
  // Sun
  await cmd({ action: 'drawCircle', cx: 56, cy: 8, r: 5, color: '#ffe066' });
  // Grass strip
  await cmd({ action: 'drawRect', x: 0, y: 46, w: 64, h: 3, color: '#4caf50', filled: true });
  // Ground
  await cmd({ action: 'drawRect', x: 0, y: 49, w: 64, h: 15, color: '#795548', filled: true });
}

// ── Tree sprite (ASCII: 14 wide × 20 tall) ────────────────────────────────
const TREE_SPRITE = [
  '......ll......',
  '.....LLLL.....',
  '....LLLLLL....',
  '...LLLLLLL....',
  '....LLLLLL....',
  '....LLLLLL....',
  '...lLLLLLl....',
  '....LLLLLL....',
  '.....LLLL.....',
  '......ll......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
  '......TT......',
];

async function drawTree(tx, ty) {
  await cmd({ action: 'drawSprite', x: tx, y: ty, palette: P, data: TREE_SPRITE });
}

// ── Stump sprite ──────────────────────────────────────────────────────────
const STUMP_SPRITE = [
  '......ww......',
  '......TT......',
  '......TT......',
];

// ── Person sprites (7 wide × 13 tall) — 4 walk poses ─────────────────────
const PERSON = {
  walk0: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbb..',
    '.bbbb..',
    '.bbbb..',
    '..pp...',
    '.pppp..',
    '.pppp..',
    '..pp...',
    '.s.s...',
  ],
  walk1: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbb..',
    '.bbbb..',
    '.bbbb..',
    '.pp.pp.',
    '.p...p.',
    '..p.p..',
    '..p....',
    '.s..s..',
  ],
  walk2: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbb..',
    '.bbbb..',
    '.bbbb..',
    '..pp...',
    '.pppp..',
    '.pppp..',
    '..pp...',
    '.s.s...',
  ],
  walk3: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbb..',
    '.bbbb..',
    '.bbbb..',
    '.pp.pp.',
    '..p.p..',
    '...p.p.',
    '....p..',
    '..s..s.',
  ],
  // Axe raised
  axeUp: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbb.h',
    '.bbbbhh',
    '.bbbbAA',
    '.bbbbAA',
    '..ppb..',
    '.pppp..',
    '.pppp..',
    '..pp...',
    '.s.s...',
  ],
  // Axe chopping down
  axeDown: [
    '..kk...',
    '.HHHH..',
    '..kk...',
    '.bbbkk.',
    '.bbb...',
    '.bbhh..',
    '.bb.AA.',
    '..ppAA.',
    '.pppp..',
    '.pppp..',
    '...pp..',
    '...s.s.',
  ],
};

const WALK_POSES = [PERSON.walk0, PERSON.walk1, PERSON.walk2, PERSON.walk3];

async function drawPerson(x, y, pose) {
  await cmd({ action: 'drawSprite', x, y, palette: P, data: pose });
}

// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  const GROUND_Y = 46;   // where ground starts
  const CHAR_Y   = 34;   // character feet align with ground (13px tall)
  const TREE_X   = 44;   // tree column
  const TREE_Y   = 26;   // tree top row

  // ─── PHASE 1: Setup ──────────────────────────────────────────────────
  console.log('\n═══ PHASE 1: Setup 64×64 tab ═══');
  await cmd({ action: 'createTab', name: 'WoodcutterAnim' });
  await new Promise(r => setTimeout(r, 800));

  const tabs = await cmd({ action: 'listTabs' });
  const activeId = await cmd({ action: 'getActiveTabId' });
  console.log(`Active tab: ${activeId}`);

  await cmd({ action: 'resize', width: 64, height: 64 });
  const sz = await cmd({ action: 'getSize' });
  console.log(`Size: ${JSON.stringify(sz)}`);

  await cmd({ action: 'setAnimationMode', enabled: true });
  console.log('✓ Animation ON');

  // ─── PHASE 2: Set anchor for character ───────────────────────────────
  console.log('\n═══ PHASE 2: Named anchor ═══');
  await cmd({ action: 'setAnchor', name: 'char', x: 4, y: CHAR_Y });
  const anchor = await cmd({ action: 'getAnchor', name: 'char' });
  console.log(`✓ Anchor 'char':`, anchor);

  // ─── PHASE 3: Walking frames (0-11) ──────────────────────────────────
  console.log('\n═══ PHASE 3: 12 walking frames ═══');
  const walkFrames = 12;
  const startX = 4, endX = 36;

  for (let i = 0; i < walkFrames; i++) {
    process.stdout.write(`  Frame ${i}... `);
    await cmd({ action: 'ensureFrame', index: i });
    await cmd({ action: 'clear' });
    await drawBg();
    await drawTree(TREE_X, TREE_Y);

    const charX = Math.round(startX + (endX - startX) * (i / (walkFrames - 1)));
    const pose = WALK_POSES[i % 4];
    await drawPerson(charX, CHAR_Y, pose);

    // Update anchor
    await cmd({ action: 'setAnchor', name: 'char', x: charX, y: CHAR_Y });

    const bb = await cmd({ action: 'query', type: 'getBoundingBox' });
    console.log(`✓ charX=${charX}, bbox=${JSON.stringify(bb)}`);
  }

  // ─── PHASE 4: Snapshot check before chopping ─────────────────────────
  console.log('\n═══ PHASE 4: querySnapshot (scale=2) ═══');
  await cmd({ action: 'goToFrame', index: walkFrames - 1 });
  const snapshot = await cmd({ action: 'querySnapshot', scale: 2, maxColors: 10 });
  console.log('Canvas ASCII preview:');
  // Print first 16 rows of ascii
  const rows = snapshot.ascii.split('\n').slice(0, 16);
  rows.forEach(r => console.log('  |' + r + '|'));
  console.log('Legend:', snapshot.legend);

  // ─── PHASE 5: Copy background for reuse ──────────────────────────────
  console.log('\n═══ PHASE 5: copyRegion background ═══');
  // Draw a clean background frame and copy it
  await cmd({ action: 'ensureFrame', index: walkFrames });
  await cmd({ action: 'clear' });
  await drawBg();
  const copied = await cmd({ action: 'copyRegion', x: 0, y: 0, w: 64, h: 64 });
  console.log(`✓ Copied region: ${JSON.stringify(copied)}`);

  // ─── PHASE 6: Chopping frames (12-19) ────────────────────────────────
  console.log('\n═══ PHASE 6: 8 chopping frames ═══');
  const chopFrames = 8;

  for (let i = 0; i < chopFrames; i++) {
    const frameIdx = walkFrames + i;
    process.stdout.write(`  Frame ${frameIdx}... `);
    await cmd({ action: 'ensureFrame', index: frameIdx });
    await cmd({ action: 'clear' });

    // Paste background using clipboard
    await cmd({ action: 'pasteRegion', x: 0, y: 0 });

    if (i < 4) {
      // Tree still standing, person chopping
      await drawTree(TREE_X, TREE_Y);
      const chopPose = (i % 2 === 0) ? PERSON.axeUp : PERSON.axeDown;
      await drawPerson(36, CHAR_Y, chopPose);
    } else {
      // Tree fallen - just stump
      await cmd({ action: 'drawSprite', x: TREE_X, y: TREE_Y + 17, palette: P, data: STUMP_SPRITE });
      // Wood chips flying
      const chipColors = ['#bcaaa4', '#a1887f', '#795548'];
      for (let c = 0; c < 5; c++) {
        const chipX = TREE_X + 6 + (i - 4) * 3 + c * 2;
        const chipY = TREE_Y + 15 + Math.round(Math.sin(c) * 3);
        if (chipX < 64) await cmd({ action: 'drawPixel', x: chipX, y: chipY, color: chipColors[c % 3] });
      }
      await drawPerson(36, CHAR_Y, PERSON.walk0);
    }

    const bb = await cmd({ action: 'query', type: 'getBoundingBox' });
    console.log(`✓ bbox=${JSON.stringify(bb)}`);
  }

  // ─── PHASE 7: Final verify ────────────────────────────────────────────
  console.log('\n═══ PHASE 7: exportBase64 verify ═══');
  await cmd({ action: 'goToFrame', index: 0 });
  const exported = await cmd({ action: 'exportBase64', format: 'png' });
  console.log(`✓ Export: format=${exported.format}, bytes=${exported.bytes}`);
  console.log('  dataUrl prefix:', exported.dataUrl.substring(0, 40) + '...');

  const totalFrames = await cmd({ action: 'getFrameCount' });
  console.log(`\n🎉 Done! ${totalFrames} frames. Press Play to watch!`);
  process.exit(0);
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
