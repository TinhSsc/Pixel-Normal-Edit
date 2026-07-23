export function normalizePixelData(pixels) {
  if (pixels instanceof Uint32Array) return pixels;
  if (Array.isArray(pixels) || pixels instanceof ArrayBuffer || pixels.buffer) {
    try {
      return new Uint32Array(pixels.buffer || pixels);
    } catch (e) {
      return new Uint32Array(Object.values(pixels));
    }
  }
  return new Uint32Array(Object.values(pixels));
}
