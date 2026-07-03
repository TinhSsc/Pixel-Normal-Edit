const PIN_LIMIT = 3;
const STORAGE_KEY = 'toolPopupPins';

const expanded = {};       // { [baseTool]: boolean } - không lưu localStorage
const activeVariant = {};  // { [baseTool]: variantId } - không lưu localStorage
let pins = loadPins();     // { [baseTool]: [variantId, ...] } - max 3 mỗi baseTool, FIFO

function loadPins() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePins() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

export function isExpanded(baseTool) {
  return !!expanded[baseTool];
}

export function setExpanded(baseTool, value) {
  expanded[baseTool] = value;
}

export function getActiveVariant(baseTool, fallbackId) {
  return activeVariant[baseTool] || fallbackId;
}

export function setActiveVariant(baseTool, variantId) {
  activeVariant[baseTool] = variantId;
}

export function getPins(baseTool) {
  return pins[baseTool] || [];
}

export function isPinned(baseTool, variantId) {
  return getPins(baseTool).includes(variantId);
}

export function togglePin(baseTool, variantId) {
  const list = pins[baseTool] ? [...pins[baseTool]] : [];
  const idx = list.indexOf(variantId);
  if (idx !== -1) {
    list.splice(idx, 1);
  } else {
    if (list.length >= PIN_LIMIT) list.shift(); // bỏ pin cũ nhất (FIFO)
    list.push(variantId);
  }
  pins[baseTool] = list;
  savePins();
}
