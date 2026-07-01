# Pixel Normal Edit

Pixel Normal Edit is a powerful web-based pixel art editing tool built with React and Vite. The application provides an intuitive interface and robust features for pixel artists and game developers.

## Key Features

- **Flexible Pixel Editing**: Supports pixel drawing, eraser, color picking, and grid resizing.
- **Background & Layers Support**: Built-in feature to add background images (strictly controlled to prevent AI-generated image conflicts).
- **Zoom In/Out & Grid**: Supports various grid sizes (16x16, 32x32, 64x64) and smooth canvas zooming without quality loss.
- **Multi-language (i18n)**: Includes support for multiple languages including Vietnamese and English via a language dictionary system.
- **Image Optimization**: Compress and download high-quality images (PNG, JPEG, WEBP).
- **History Management (Undo / Redo)**: Easily undo and redo editing actions.

## Performance Optimization & Tech Stack

This project is specially designed with high-level web browser optimization techniques, ensuring smooth performance even with multi-million pixel canvases:

- **Flat Buffer & Typed Arrays (`Uint32Array`)**: The core `pixelMap` data is stored as a low-level one-dimensional flat array (`Uint32Array`). Colors are encoded as 32-bit integers instead of `'#RRGGBB'` strings, enabling $O(1)$ data access, reducing RAM consumption by 90%, and eliminating Garbage Collector bottlenecks.
- **Direct Memory Blitting (ImageData API)**: Instead of using `ctx.fillRect` loops to draw individual pixels, the system links the `Uint32Array` buffer directly to `ImageData.data.buffer`, allowing instantaneous rendering of the entire canvas in just a few milliseconds.
- **CSS Virtual Grid (GPU Acceleration)**: Removes the heavy CPU burden of drawing grids using the `Canvas 2D API`. The coordinate grid is generated using `background-image` (with `linear-gradient`) on an overlay layer. This delegates the entire grid rendering task to the GPU, guaranteeing smooth 60FPS zooming and panning.
- **Multithreading with Web Workers**: The system continuously delegates computationally expensive algorithms like **Flood Fill (BFS)** and **Magic Eraser** to background processes (Web Workers), completely freeing the Main Thread from freezing or lagging and ensuring a consistently smooth experience across all canvas sizes.
- **Asynchronous Chunk Processing**: Asynchronous processing algorithms slice data arrays into small chunks and combine them with `requestAnimationFrame` (or `setTimeout`) to ensure UI progress indicators update smoothly when overwriting tens of thousands of changes simultaneously.
- **Static & Regex Parsing**: Aggressive optimization of module imports and the use of pure JS Regular Expressions (Regex) to parse colors, avoiding expensive workarounds using hidden DOM elements (like 1x1 Canvases).

**Core Frameworks**: React, Vite, HTML5 Canvas API, Vanilla CSS.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at the displayed URL (usually http://localhost:5173).

## Contributing

Please adhere to the rules in the `.agents` directory or project guidelines when creating Pull Requests or developing new features.
