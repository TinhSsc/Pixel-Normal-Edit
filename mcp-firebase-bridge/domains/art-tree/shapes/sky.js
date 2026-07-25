
/**
 * Draws a basic solid sun
 */
function drawSunBasic(cx, cy, r) {
  return [shapes.drawCircle(cx, cy, r, '#ffeb3b', true)];
}

/**
 * Draws a soft glowing sun using concentric circles with decreasing opacity
 * Since we don't have true opacity in standard shapes yet, we use color stepping
 * (white -> light yellow -> yellow -> orange)
 */
function drawSunSoft(cx, cy, r) {
  const commands = [];
  commands.push(shapes.drawCircle(cx, cy, Math.floor(r * 1.5), '#ffe082', true)); // Outer glow
  commands.push(shapes.drawCircle(cx, cy, Math.floor(r * 1.2), '#ffeb3b', true)); // Mid glow
  commands.push(shapes.drawCircle(cx, cy, Math.floor(r * 0.8), '#fff59d', true)); // Inner glow
  commands.push(shapes.drawCircle(cx, cy, Math.floor(r * 0.4), '#ffffff', true)); // Core
  return commands;
}

/**
 * Draws a sun with distinct rays
 */
function drawSunRays(cx, cy, r) {
  const commands = [];
  const color = '#ffeb3b';
  // Central body
  commands.push(shapes.drawCircle(cx, cy, r, color, true));
  
  // Outer rays
  const rayL = Math.floor(r * 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    const x1 = Math.round(cx + (r + 2) * Math.cos(a));
    const y1 = Math.round(cy + (r + 2) * Math.sin(a));
    const x2 = Math.round(cx + rayL * Math.cos(a));
    const y2 = Math.round(cy + rayL * Math.sin(a));
    commands.push(shapes.drawLine(x1, y1, x2, y2, color));
  }
  return commands;
}

/**
 * Draws a simulated gradient sky using horizontal bands of color
 * @param {Array<string>} colors - Array of hex colors from top to bottom
 */
function drawSkyGradient(x, y, w, h, colors) {
  const commands = [];
  const bandHeight = Math.ceil(h / colors.length);
  
  for (let i = 0; i < colors.length; i++) {
    const bandY = y + i * bandHeight;
    // To ensure we cover the total height, the last band fills the rest
    const bh = (i === colors.length - 1) ? (y + h - bandY) : bandHeight;
    commands.push(shapes.drawRectangle(x, bandY, w, bh, colors[i], true));
  }
  return commands;
}

module.exports = {
  drawSunBasic,
  drawSunSoft,
  drawSunRays,
  drawSkyGradient
};
