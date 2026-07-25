export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function hexToUint32(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = 255;
  // This uses the little-endian format which is typical for Canvas ImageData
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function colorDistance(r1, g1, b1, a1 = 255, r2, g2, b2, a2 = 255) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);
}

const parseCache = new Map();

export function parseColorToRgba(color) {
  if (!color || color === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (parseCache.has(color)) return parseCache.get(color);

  let result;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255;
    result = { r, g, b, a };
  } else if (color.startsWith('rgb')) {
    const m = color.match(/[\d.]+/g);
    result = {
      r: parseInt(m[0]),
      g: parseInt(m[1]),
      b: parseInt(m[2]),
      a: m[3] !== undefined ? Math.round(parseFloat(m[3]) * 255) : 255
    };
  } else {
    // fallback for named colors which are not heavily used dynamically
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 1;
    tmpCanvas.height = 1;
    const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
    tmpCtx.fillStyle = color;
    tmpCtx.fillRect(0, 0, 1, 1);
    const d = tmpCtx.getImageData(0, 0, 1, 1).data;
    result = { r: d[0], g: d[1], b: d[2], a: d[3] };
  }

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

export function uint32ToRgba(uint32) {
  if (uint32 === 0) return { r: 0, g: 0, b: 0, a: 0 };
  let r, g, b, a;
  if (isLittleEndian) {
    r = uint32 & 0xFF;
    g = (uint32 >> 8) & 0xFF;
    b = (uint32 >> 16) & 0xFF;
    a = (uint32 >>> 24) & 0xFF;
  } else {
    a = uint32 & 0xFF;
    b = (uint32 >> 8) & 0xFF;
    g = (uint32 >> 16) & 0xFF;
    r = (uint32 >>> 24) & 0xFF;
  }
  return { r, g, b, a };
}

export function rgbaToHex(r, g, b, a = 255) {
  const toHex = v => v.toString(16).padStart(2, '0');
  if (a < 255) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function parseUint32ToHex(uint32) {
  const { r, g, b } = uint32ToRgba(uint32);
  // input type="color" requires exactly 7 characters (#RRGGBB), ignoring alpha
  const toHex = v => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function blendUint32(bgUint32, fgUint32) {
  if (fgUint32 === 0) return bgUint32; // Foreground is completely transparent
  if (bgUint32 === 0) return fgUint32; // Background is completely transparent
  
  let bgR, bgG, bgB, bgA;
  let fgR, fgG, fgB, fgA;

  if (isLittleEndian) {
    bgR = bgUint32 & 0xFF;
    bgG = (bgUint32 >> 8) & 0xFF;
    bgB = (bgUint32 >> 16) & 0xFF;
    bgA = (bgUint32 >>> 24) & 0xFF;

    fgR = fgUint32 & 0xFF;
    fgG = (fgUint32 >> 8) & 0xFF;
    fgB = (fgUint32 >> 16) & 0xFF;
    fgA = (fgUint32 >>> 24) & 0xFF;
  } else {
    bgA = bgUint32 & 0xFF;
    bgB = (bgUint32 >> 8) & 0xFF;
    bgG = (bgUint32 >> 16) & 0xFF;
    bgR = (bgUint32 >>> 24) & 0xFF;

    fgA = fgUint32 & 0xFF;
    fgB = (fgUint32 >> 8) & 0xFF;
    fgG = (fgUint32 >> 16) & 0xFF;
    fgR = (fgUint32 >>> 24) & 0xFF;
  }

  if (fgA === 255) return fgUint32; // Foreground is opaque

  const alpha = fgA / 255;
  const invAlpha = 1 - alpha;
  const outA = fgA + bgA * invAlpha;
  
  if (outA === 0) return 0;
  
  const r = Math.round((fgR * fgA + bgR * bgA * invAlpha) / outA);
  const g = Math.round((fgG * fgA + bgG * bgA * invAlpha) / outA);
  const b = Math.round((fgB * fgA + bgB * bgA * invAlpha) / outA);
  const finalA = Math.round(outA);

  if (isLittleEndian) {
    return ((finalA << 24) | (b << 16) | (g << 8) | r) >>> 0;
  } else {
    return ((r << 24) | (g << 16) | (b << 8) | finalA) >>> 0;
  }
}

