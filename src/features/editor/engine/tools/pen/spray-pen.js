import { GRID_WIDTH, GRID_HEIGHT } from '../../core/state.js';
import { writePixel } from '../../core/pixel-writer.js';
import { renderPixels } from '../../core/render.js';

let sprayRAF = null;
let currentCell = null;
let currentColor = null;
let isSpraying = false;

function doSpray() {
  if (!isSpraying || !currentCell) return;
  
  const sizeInput = document.getElementById('sprayPenSize');
  const size = sizeInput ? parseInt(sizeInput.value, 10) || 10 : 10;
  
  const densityInput = document.getElementById('sprayPenDensity');
  const density = densityInput ? parseInt(densityInput.value, 10) || 10 : 10;
  
  const shapeInput = document.getElementById('globalPenShape');
  const shape = shapeInput ? shapeInput.value : 'circle';

  const radius = size / 2;
  const radiusSq = radius * radius;
  
  let pixelsDrawn = 0;
  
  for (let i = 0; i < density; i++) {
    let dx, dy;
    
    if (shape === 'circle') {
      const angle = Math.random() * 2 * Math.PI;
      const r = radius * Math.sqrt(Math.random());
      dx = r * Math.cos(angle);
      dy = r * Math.sin(angle);
    } else {
      dx = (Math.random() - 0.5) * size;
      dy = (Math.random() - 0.5) * size;
    }

    const px = Math.floor(currentCell.x + dx);
    const py = Math.floor(currentCell.y + dy);

    if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT) {
      writePixel(px, py, currentColor);
      pixelsDrawn++;
    }
  }

  if (pixelsDrawn > 0) {
    renderPixels();
  }
  
  sprayRAF = requestAnimationFrame(doSpray);
}

export function useSprayPen(event, cell, color) {
  currentCell = cell;
  currentColor = color;

  if (event === 'down') {
    isSpraying = true;
    if (sprayRAF) cancelAnimationFrame(sprayRAF);
    sprayRAF = requestAnimationFrame(doSpray);
  } else if (event === 'up') {
    isSpraying = false;
    if (sprayRAF) {
      cancelAnimationFrame(sprayRAF);
      sprayRAF = null;
    }
  }
}
