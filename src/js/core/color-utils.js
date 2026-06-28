export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function colorDistance(r1, g1, b1, a1 = 255, r2, g2, b2, a2 = 255) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);
}

const parseCache = new Map();

const tmpCanvas = document.createElement('canvas');
tmpCanvas.width = 1;
tmpCanvas.height = 1;
const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });

export function parseColorToRgba(color) {
  if (!color || color === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (parseCache.has(color)) return parseCache.get(color);

  tmpCtx.clearRect(0, 0, 1, 1);
  tmpCtx.fillStyle = color;
  tmpCtx.fillRect(0, 0, 1, 1);
  const d = tmpCtx.getImageData(0, 0, 1, 1).data;
  const result = { r: d[0], g: d[1], b: d[2], a: d[3] };
  parseCache.set(color, result);
  return result;
}

const uint32Cache = new Map();
const isLittleEndian = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

export function parseColorToUint32(color) {
  if (!color || color === 'transparent') return 0;
  if (uint32Cache.has(color)) return uint32Cache.get(color);

  const rgba = parseColorToRgba(color);
  let val;
  if (isLittleEndian) {
    val = (rgba.a << 24) | (rgba.b << 16) | (rgba.g << 8) | rgba.r;
  } else {
    val = (rgba.r << 24) | (rgba.g << 16) | (rgba.b << 8) | rgba.a;
  }
  // Ensure it's treated as unsigned 32-bit
  val = val >>> 0;
  uint32Cache.set(color, val);
  return val;
}

export function rgbaToHex(r, g, b, a = 255) {
  const toHex = v => v.toString(16).padStart(2, '0');
  if (a < 255) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
