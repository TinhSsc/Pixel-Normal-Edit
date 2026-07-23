const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, onSnapshot } = require("firebase/firestore");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

// Load variables from the parent .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use session ID from args or default
const sessionId = process.argv[2] || "default-session";

const server = new McpServer({
  name: "PixelNormalEditFirebaseBridge",
  version: "1.0.0"
});

server.tool(
  "execute_editor_command",
  "Execute a command in the Pixel Normal Edit web editor",
  {
    action: z.string().describe("The action to perform (e.g. 'drawPixel', 'setTool', 'clearCanvas')"),
    payload: z.any().describe("The payload for the action. For 'drawPixel', provide { x, y, color }")
  },
  async ({ action, payload }) => {
    const commandId = crypto.randomUUID();
    const commandRef = doc(db, `mcp_commands_${sessionId}`, commandId);
    
    // Write the command to Firestore
    await setDoc(commandRef, {
      action,
      ...(payload || {}),
      status: 'pending',
      timestamp: Date.now()
    });

    // Wait for the Web Editor to process and update the status
    return new Promise((resolve) => {
      let timeoutId;

      const unsubscribe = onSnapshot(commandRef, (docSnap) => {
        const data = docSnap.data();
        if (data && data.status === 'success') {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve({
            content: [{ type: "text", text: typeof data.result === 'object' ? JSON.stringify(data.result) : String(data.result || "Command executed successfully") }]
          });
        } else if (data && data.status === 'error') {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve({
            isError: true,
            content: [{ type: "text", text: `Error: ${data.error}` }]
          });
        }
      });
      
      // Timeout after 15 seconds if the browser doesn't respond
      timeoutId = setTimeout(() => {
        unsubscribe();
        resolve({
          isError: true,
          content: [{ type: "text", text: "Timeout waiting for Web Editor to respond. Is the browser tab open and connected to this session?" }]
        });
      }, 15000);
    });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`MCP Firebase Bridge connected.`);
  console.error(`Session ID: ${sessionId}`);
  console.error(`To use with Claude Desktop, configure it to run this script with your desired session ID.`);
}

main().catch(console.error);
