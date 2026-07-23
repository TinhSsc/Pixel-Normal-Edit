import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../auth/logic/firebase/config';

class MCPFirebaseClient {
  constructor() {
    this.sessionId = null;
    this.unsubscribe = null;
    this.commandBus = null;
  }

  initialize(commandBus, sessionId = 'default-session') {
    this.commandBus = commandBus;
    this.sessionId = sessionId;
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    console.log(`[MCP Firebase] Connecting to session: ${sessionId}`);

    // We listen to the mcp_commands_{sessionId} collection for pending commands
    const commandsRef = collection(db, `mcp_commands_${sessionId}`);
    const q = query(commandsRef, where('status', '==', 'pending'));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const commandData = change.doc.data();
          const docId = change.doc.id;
          
          console.log(`[MCP Firebase] Received command:`, commandData);
          
          try {
            // Validation step
            if (!commandData || typeof commandData.action !== 'string') {
              throw new Error("Invalid command format: missing or invalid 'action'");
            }
            
            // Execute in editor
            let result = null;
            if (this.commandBus && typeof this.commandBus.execute === 'function') {
              result = await this.commandBus.execute(commandData);
            } else {
              // Fallback if commandBus is not set up exactly as expected
              console.warn('[MCP Firebase] commandBus not fully initialized');
              // Optionally dispatch an event on window if needed
            }
            
            // Mark as success
            await updateDoc(doc(db, `mcp_commands_${sessionId}`, docId), {
              status: 'success',
              result: result || { success: true }
            });
            
          } catch (error) {
            console.error(`[MCP Firebase] Command error:`, error);
            // Mark as error
            await updateDoc(doc(db, `mcp_commands_${sessionId}`, docId), {
              status: 'error',
              error: error.message || String(error)
            });
          }
        }
      });
    }, (error) => {
      console.error('[MCP Firebase] Snapshot error:', error);
    });
    
    return true; // connected
  }

  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const mcpClient = new MCPFirebaseClient();
