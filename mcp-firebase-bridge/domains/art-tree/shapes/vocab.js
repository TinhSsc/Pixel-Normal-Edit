
/**
 * Draws a 5-step breakdown of a House.
 * Step 1: Main Masses (Thân + Mái)
 * Step 2: Structural Parts (Cột, Móng, Hiên/Bậc thềm)
 * Step 3: Functional Parts (Cửa, Cửa sổ)
 * Step 4: Identifying Details (Ống khói, Viền mái, Khung cửa)
 * Step 5: Materials (Ván gỗ, Gạch)
 */
function drawHouseBreakdown(cx, cy, scale, step) {
  const commands = [];
  const color = '#37474f';
  
  const w = Math.floor(scale * 0.5);
  const h = Math.floor(scale * 0.4);
  const roofH = Math.floor(scale * 0.25);
  
  const leftX = cx - Math.floor(w/2);
  const rightX = cx + Math.floor(w/2);
  const topY = cy;
  const botY = cy + h;
  const roofTipY = topY - roofH;

  // STEP 1: MAIN MASSES
  if (step >= 1) {
    // Main Body Box
    commands.push(shapes.drawRectangle(leftX, topY, w, h, color, false));
    // Roof Triangle
    commands.push(shapes.drawLine(leftX, topY, cx, roofTipY, color));
    commands.push(shapes.drawLine(cx, roofTipY, rightX, topY, color));
  }

  // STEP 2: STRUCTURAL PARTS
  if (step >= 2) {
    // Corner Columns (Cột)
    commands.push(shapes.drawLine(leftX - 4, topY, leftX - 4, botY, color));
    commands.push(shapes.drawLine(rightX + 4, topY, rightX + 4, botY, color));
    // Foundation (Móng)
    commands.push(shapes.drawRectangle(leftX - 6, botY, w + 12, 5, color, false));
    // Front Porch Steps (Bậc thềm)
    const pW = Math.floor(w * 0.4);
    const pX = cx - Math.floor(pW/2);
    commands.push(shapes.drawRectangle(pX, botY + 5, pW, 4, color, false));
    commands.push(shapes.drawRectangle(pX - 2, botY + 9, pW + 4, 4, color, false));
  }

  // STEP 3: FUNCTIONAL PARTS
  if (step >= 3) {
    // Door (Cửa ra vào)
    const dW = Math.floor(w * 0.25);
    const dH = Math.floor(h * 0.6);
    const dX = cx - Math.floor(dW/2);
    commands.push(shapes.drawRectangle(dX, botY - dH, dW, dH, color, false));
    
    // Windows (Cửa sổ)
    const winW = Math.floor(w * 0.2);
    const winH = Math.floor(h * 0.35);
    const winY = topY + Math.floor(h * 0.2);
    // Left window
    commands.push(shapes.drawRectangle(leftX + 8, winY, winW, winH, color, false));
    // Right window
    commands.push(shapes.drawRectangle(rightX - 8 - winW, winY, winW, winH, color, false));
  }

  // STEP 4: IDENTIFYING DETAILS
  if (step >= 4) {
    // Chimney (Ống khói)
    const chimW = Math.floor(w * 0.15);
    const chimX = leftX + Math.floor(w * 0.1);
    const chimY = topY - Math.floor(roofH * 0.6);
    commands.push(shapes.drawRectangle(chimX, chimY, chimW, Math.floor(roofH * 0.5), color, false));
    commands.push(shapes.drawRectangle(chimX - 2, chimY - 4, chimW + 4, 4, color, false)); // Chimney cap
    
    // Roof Trim (Viền mái)
    commands.push(shapes.drawLine(leftX - 6, topY + 4, cx, roofTipY - 6, color));
    commands.push(shapes.drawLine(cx, roofTipY - 6, rightX + 6, topY + 4, color));
    
    // Window/Door Frames & Knobs (Khung cửa)
    const winW = Math.floor(w * 0.2);
    const winH = Math.floor(h * 0.35);
    const winY = topY + Math.floor(h * 0.2);
    // Left window cross
    commands.push(shapes.drawLine(leftX + 8 + Math.floor(winW/2), winY, leftX + 8 + Math.floor(winW/2), winY + winH, color));
    commands.push(shapes.drawLine(leftX + 8, winY + Math.floor(winH/2), leftX + 8 + winW, winY + Math.floor(winH/2), color));
    // Right window cross
    commands.push(shapes.drawLine(rightX - 8 - Math.floor(winW/2), winY, rightX - 8 - Math.floor(winW/2), winY + winH, color));
    commands.push(shapes.drawLine(rightX - 8 - winW, winY + Math.floor(winH/2), rightX - 8, winY + Math.floor(winH/2), color));
    // Door knob
    commands.push(shapes.drawCircle(cx + Math.floor(w * 0.08), botY - Math.floor(h * 0.3), 1, color, true));
  }

  // STEP 5: SURFACE MATERIALS
  if (step >= 5) {
    const matColor = '#9e9e9e';
    // Wood Planks on the main body
    for (let i = 1; i < 5; i++) {
      const plankY = topY + i * Math.floor(h / 5);
      commands.push(shapes.drawLine(leftX + 2, plankY, rightX - 2, plankY, matColor));
    }
    
    // Brick lines on the chimney
    const chimW = Math.floor(w * 0.15);
    const chimX = leftX + Math.floor(w * 0.1);
    const chimY = topY - Math.floor(roofH * 0.6);
    commands.push(shapes.drawLine(chimX, chimY + 4, chimX + chimW, chimY + 4, matColor));
    commands.push(shapes.drawLine(chimX, chimY + 8, chimX + chimW, chimY + 8, matColor));
    commands.push(shapes.drawLine(chimX + 4, chimY + 4, chimX + 4, chimY + 8, matColor)); // vertical brick line
  }

  return commands;
}

module.exports = {
  drawHouseBreakdown
};
