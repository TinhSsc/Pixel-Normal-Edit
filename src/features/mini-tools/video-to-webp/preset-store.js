/**
 * preset-store — Lưu cấu hình custom vào localStorage.
 * Key: v2w_presets_v1 → { presets: [{id, name, config}], defaultId }
 */
const KEY = 'v2w_presets_v1';

export const DEFAULT_CONFIG = {
  targetMB: 2,
  format: 'auto', // auto | webp | gif
  capDim: 480, // chiều cao tối đa
  baseFps: 12,
  maxSpeed: 1.5, // tua nhanh tối đa (không cắt video)
  priority: 'balanced', // balanced | sharpest | smallest
};

function readStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { presets: [], defaultId: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.presets)) return { presets: [], defaultId: null };
    return parsed;
  } catch (_) {
    return { presets: [], defaultId: null };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (_) { /* quota / private mode — bỏ qua */ }
}

export function listPresets() {
  return readStore().presets;
}

export function getDefaultPreset() {
  const store = readStore();
  if (!store.defaultId) return null;
  return store.presets.find((p) => p.id === store.defaultId) || null;
}

export function savePreset(name, config) {
  const store = readStore();
  const clean = (name || '').trim().slice(0, 40) || 'Preset';
  const existing = store.presets.find((p) => p.name === clean);
  if (existing) {
    existing.config = { ...config };
    if (!store.defaultId) store.defaultId = existing.id;
  } else {
    const id = `p${Date.now().toString(36)}`;
    store.presets.push({ id, name: clean, config: { ...config } });
    if (!store.defaultId) store.defaultId = id;
  }
  writeStore(store);
  return readStore().presets;
}

export function deletePreset(id) {
  const store = readStore();
  store.presets = store.presets.filter((p) => p.id !== id);
  if (store.defaultId === id) store.defaultId = store.presets[0]?.id || null;
  writeStore(store);
  return readStore().presets;
}

export function setDefaultPreset(id) {
  const store = readStore();
  store.defaultId = id;
  writeStore(store);
  return readStore();
}
