# @pixel-normal-edit/mcp

**Model Context Protocol (MCP) Bridge for Pixel Normal Edit**

This package is a standalone MCP server that allows AI agents (like Claude Desktop, Cursor, or Windsurf) to connect directly to your live [Pixel Normal Edit](https://github.com/TinhSsc/Pixel-Normal-Edit.git) canvas through Firebase. 

By connecting your AI agent to this server, the AI can read your canvas state and draw pixel art in real time via structured tools.

## How it works

Since Pixel Normal Edit runs entirely in the browser (client-side), AI agents running on your desktop cannot manipulate its DOM directly. 
This bridge solves that by using Firebase Firestore as a real-time message bus:

1. **AI Agent** calls an MCP tool (e.g. `draw_rect`) via this Node.js bridge.
2. **Bridge** writes the command to Firestore under your specific Session ID.
3. **Browser** listens to that Firestore document, executes the command on the canvas, and writes the result back.
4. **Bridge** reads the result and returns it to the AI Agent.

## Security Information

You might notice that the Firebase API keys (`VITE_FIREBASE_API_KEY`, etc.) are included directly in the source code of this package. This is completely safe and by design:

* **API Keys are Routing Identifiers:** In the context of Firebase Web SDK, these keys are NOT secret passwords. They merely act as a "public address" to tell the bridge which Firebase project to connect to.
* **Firestore Security Rules:** Real security is enforced on the server-side via `firestore.rules`. The rules ensure that connections can only be established using a valid, unguessable UUID (the Session ID). 
* **Zero User Data Access:** The bridge only has access to its designated `mcp_sessions` sandbox. It is explicitly blocked from reading or writing any user accounts, passwords, or other collections.

## Usage (For Users)

You do not need to download or clone this repository manually to use it! 

To connect your AI, simply open Pixel Normal Edit, go to **Settings > Account > AI Connection (MCP)** and copy the provided command or configuration. 

For example, to run it via `npx`:
```bash
npx -y @pixel-normal-edit/mcp@latest YOUR_SESSION_ID
```
*(Replace `YOUR_SESSION_ID` with the ID provided in your app).*

### Claude Desktop Configuration
Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "pixel-normal-edit": {
      "command": "npx",
      "args": [
        "-y",
        "@pixel-normal-edit/mcp@latest",
        "YOUR_SESSION_ID"
      ],
      "env": {
        "DOTENV_CONFIG_QUIET": "true"
      }
    }
  }
}
```

## Available AI Tools

This bridge exposes dozens of native tools to the AI, categorized into:
* **Drawing Primitives:** `draw_pixel`, `draw_rect`, `draw_circle`, `draw_line`, `draw_fill`, etc.
* **Canvas Info & Vision:** `query_snapshot` (gets an ASCII representation of the canvas), `query_palette`, `query_bounding_box`, `canvas_get_size`.
* **Sprite System:** `sprite_draw`, `sprite_save_stamp`, `sprite_use_stamp` for bulk drawing optimization.
* **Animation Frames:** `animation_add_frame`, `animation_go_to_frame`, `animation_compare_frames`.
* **Region & Bulk:** `region_copy`, `region_paste`, `bulk_replace_color`.

## Development (For Contributors)

If you want to modify this bridge or run it locally from source:

1. Clone the project.
2. Navigate to `mcp-firebase-bridge/`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment variables:
   Ensure there is a `.env` file in the root of the project with your Firebase configuration.
5. Run the bridge:
   ```bash
   npm start YOUR_SESSION_ID
   ```

### HTTP Mode
By default, the server runs in `stdio` mode (standard for Claude Desktop). You can also run it as an HTTP server:
```bash
npm run mcp:http
```
(Or set `HTTP_PORT=3456`).
