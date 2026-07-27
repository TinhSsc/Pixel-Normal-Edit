import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../auth/logic/firebase/config';

// ── Security: whitelist of allowed actions ─────────────────────────────────
const ALLOWED_ACTIONS = new Set([
  'ping','getSize','resize','clear','trim',
  'setAnimationMode','addFrame','insertFrameAt','removeFrame','goToFrame',
  'nextFrame','prevFrame','reorderFrame','ensureFrame','getFrameCount',
  'getActiveFrameIndex','isAnimationMode','getFrameDifferences',
  'drawPixel','erasePixel','getPixel','drawLine','drawCircle','drawEllipse',
  'drawRect','drawPolygon','fill','floodFillAll','replaceColor',
  'drawGradientRect','applyFilter','drawSprite',
  'saveStamp','useStamp','listStamps','deleteStamp',
  'copyRegion','pasteRegion',
  'setAnchor','getAnchor','listAnchors','clearAnchors','drawFromAnchor',
  'query','querySnapshot','exportBase64',
  'listTabs','getActiveTabId','switchTab','createTab','closeTab','renameTab','quickSave',
  'zoomIn','zoomOut','fitToScreen','setZoom','setPan','getViewport',
  'getModes','setGradient','setMirror','setGrid','setOnionSkin',
  'setTool','getTool','setToolParam','getToolParam','setColor','getColor','swapColors',
  'export','exportAnimation','undo','redo','getCapabilities',
  'showUserInputRequest', 'drawPixelsBulk'
]);

// ── Security: rate limiter (max 20 cmds/sec) ──────────────────────────────
const _rateLimiter = {
  count: 0, resetAt: 0, MAX: 20, WINDOW: 1000,
  allow() {
    const now = Date.now();
    if (now > this.resetAt) { this.count = 0; this.resetAt = now + this.WINDOW; }
    if (this.count >= this.MAX) return false;
    this.count++; return true;
  }
};

// ── Security: validate session ID ─────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidSession(id) {
  return typeof id === 'string' && (UUID_RE.test(id) || id.length >= 8);
}

// ── Cleanup: xóa document sau khi xử lý xong ─────────────────────────────
//   delayMs = 5000  → success: cho bridge 5s để đọc kết quả trước khi xóa
//   delayMs = 0     → error tức thì: không cần giữ lại
function scheduleDelete(docRef, delayMs = 5000) {
  setTimeout(async () => {
    try { await deleteDoc(docRef); } catch { /* ignore — đã bị xóa */ }
  }, delayMs);
}

class MCPFirebaseClient {
  constructor() {
    this.sessionId = null;
    this.unsubscribe = null;
    this.commandBus = null;
  }

  initialize(commandBus, sessionId = 'default-session') {
    if (!isValidSession(sessionId)) {
      console.error('[MCP Firebase] Invalid session ID — must be UUID or alphanumeric ≥8 chars');
      return false;
    }
    this.commandBus = commandBus;
    this.sessionId  = sessionId;
    if (this.unsubscribe) this.unsubscribe();

    console.log(`[MCP Firebase] Session: ${sessionId.slice(0,8)}...`);
    
    // Save current url to session document so the bridge knows where the user is
    setDoc(doc(db, 'mcp_sessions', sessionId), {
      currentUrl: window.location.href,
      lastActive: Date.now()
    }, { merge: true }).catch(console.error);

    const commandsRef = collection(db, 'mcp_sessions', sessionId, 'commands');

    // Clear old pending commands on connect to prevent freezing the browser
    getDocs(commandsRef).then(snap => {
      snap.forEach(d => {
        deleteDoc(d.ref).catch(() => {});
      });
      console.log(`[MCP Firebase] Cleared ${snap.size} old commands for safety.`);
    }).catch(console.error);

    const q = query(commandsRef, where('status', '==', 'pending'));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added') return;

        const commandData = change.doc.data();
        const docId       = change.doc.id;
        const docRef      = doc(db, 'mcp_sessions', sessionId, 'commands', docId);

        // ── Rate limit ────────────────────────────────────────────────
        if (!_rateLimiter.allow()) {
          console.warn('[MCP Firebase] Rate limit — dropping cmd');
          await updateDoc(docRef, { status: 'error', error: 'Rate limit exceeded (max 20 cmd/s)' });
          scheduleDelete(docRef, 0);
          return;
        }

        console.debug(`[MCP Firebase] cmd=${commandData.action} id=${docId.slice(0,8)}`);

        try {
          if (!commandData || typeof commandData.action !== 'string') {
            console.warn("[MCP Firebase] Invalid command structure, dropping immediately.", docId, commandData);
            scheduleDelete(docRef, 0);
            return;
          }

          if (!ALLOWED_ACTIONS.has(commandData.action)) {
            console.warn(`[MCP Firebase] Action '${commandData.action}' is not allowed, dropping.`);
            scheduleDelete(docRef, 0);
            return;
          }

          if (commandData.data && Array.isArray(commandData.data)) {
            if (commandData.data.length > 256 || (commandData.data[0] || '').length > 256)
              throw new Error('Sprite/data too large (max 256×256)');
          }

          // ── Execute ───────────────────────────────────────────────
          let result = null;
          if (this.commandBus && typeof this.commandBus.execute === 'function') {
            window.dispatchEvent(new CustomEvent('ai-connection-status', {
              detail: { type: 'connected', text: 'Trạng thái: đã kết nối mcp', sessionId: this.sessionId }
            }));
            result = await this.commandBus.execute(commandData);
          } else {
            console.warn('[MCP Firebase] commandBus not initialized');
          }

          // ── Mark success → schedule delete in 5s ─────────────────
          await updateDoc(docRef, {
            status: 'success',
            result: result || { success: true },
          });
          scheduleDelete(docRef, 5000);

        } catch (error) {
          console.error('[MCP Firebase] Error:', error.message);

          // ── Mark error → schedule delete in 5s ───────────────────
          await updateDoc(docRef, {
            status: 'error',
            error: error.message || String(error),
          });
          scheduleDelete(docRef, 5000);
        }
      });
    }, (error) => {
      console.error('[MCP Firebase] Snapshot error:', error);
    });

    return true;
  }

  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const mcpClient = new MCPFirebaseClient();
