// Midpoint circle algorithm
export function circlePoints(cx, cy, r, callback) {
  let x = 0;
  let y = r;
  let d = 1 - r;

  function plot8(px, py) {
    callback(cx + px, cy + py);
    callback(cx - px, cy + py);
    callback(cx + px, cy - py);
    callback(cx - px, cy - py);
    callback(cx + py, cy + px);
    callback(cx - py, cy + px);
    callback(cx + py, cy - px);
    callback(cx - py, cy - px);
  }

  plot8(x, y);
  while (x < y) {
    x++;
    if (d < 0) {
      d += 2 * x + 1;
    } else {
      y--;
      d += 2 * (x - y) + 1;
    }
    plot8(x, y);
  }
}
