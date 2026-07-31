/**
 * Default keyboard shortcuts configuration
 * Each shortcut: { key: string, ctrl: boolean, shift: boolean, alt: boolean, label: string }
 */

export const DEFAULT_SHORTCUTS = {
  // Tools
  'tool.pixelPen':      { key: 'b', ctrl: false, shift: false, alt: false, label: 'tool.pixelPen' },
  'tool.highlightPen':  { key: 'b', ctrl: false, shift: true,  alt: false, label: 'tool.highlightPen' },
  'tool.blendBrush':    { key: 'b', ctrl: false, shift: false, alt: true,  label: 'tool.blendBrush' },
  'tool.eraser':        { key: 'e', ctrl: false, shift: false, alt: false, label: 'tool.eraser' },
  'tool.fill':          { key: 'g', ctrl: false, shift: false, alt: false, label: 'tool.fill' },
  'tool.magicEraser':   { key: 'e', ctrl: false, shift: true,  alt: false, label: 'tool.magicEraser' },
  'tool.select':        { key: 'm', ctrl: false, shift: false, alt: false, label: 'tool.select' },
  'tool.replaceColor':  { key: 'r', ctrl: false, shift: true,  alt: false, label: 'tool.replaceColor' },
  'tool.outline':       { key: 'o', ctrl: false, shift: false, alt: false, label: 'tool.outline' },
  'tool.line':          { key: 'l', ctrl: false, shift: false, alt: false, label: 'tool.line' },
  'tool.rect':          { key: 'u', ctrl: false, shift: false, alt: false, label: 'tool.rect' },
  'tool.circle':        { key: 'c', ctrl: false, shift: false, alt: false, label: 'tool.circle' },
  'tool.text':          { key: 't', ctrl: false, shift: false, alt: false, label: 'tool.text' },
  'tool.pan':           { key: 'h', ctrl: false, shift: false, alt: false, label: 'tool.pan' },

  // Actions
  'action.undo':        { key: 'z', ctrl: true,  shift: false, alt: false, label: 'action.undo' },
  'action.redo':        { key: 'y', ctrl: true,  shift: false, alt: false, label: 'action.redo' },
  'action.redoAlt':     { key: 'z', ctrl: true,  shift: true,  alt: false, label: 'action.redo' },
  'action.copy':        { key: 'c', ctrl: true,  shift: false, alt: false, label: 'action.copy' },
  'action.cut':         { key: 'x', ctrl: true,  shift: false, alt: false, label: 'action.cut' },
  'action.paste':       { key: 'v', ctrl: true,  shift: false, alt: false, label: 'action.paste' },
  'action.delete':      { key: 'delete',  ctrl: false, shift: false, alt: false, label: 'action.delete' },
  'action.selectAll':   { key: 'a', ctrl: true,  shift: false, alt: false, label: 'action.selectAll' },
  'action.deselect':    { key: 'd', ctrl: true,  shift: false, alt: false, label: 'action.deselect' },
  'action.swapColors':  { key: 'x', ctrl: false, shift: false, alt: false, label: 'action.swapColors' },
  'action.newCanvas':   { key: 'n', ctrl: true,  shift: false, alt: false, label: 'action.newCanvas' },
  'action.quickSave':   { key: 's', ctrl: true,  shift: false, alt: false, label: 'action.quickSave' },
  'action.saveAs':      { key: 's', ctrl: true,  shift: true,  alt: false, label: 'action.saveAs' },
  'action.export':      { key: 'e', ctrl: true,  shift: false, alt: false, label: 'action.export' },
  'action.settings':    { key: ',', ctrl: true,  shift: false, alt: false, label: 'action.settings' },

  // Zoom
  'zoom.in':            { key: '=', ctrl: true,  shift: false, alt: false, label: 'zoom.in' },
  'zoom.out':           { key: '-', ctrl: true,  shift: false, alt: false, label: 'zoom.out' },
  'zoom.fit':           { key: '0', ctrl: true,  shift: false, alt: false, label: 'zoom.fit' },

  // Modes
  'mode.gradient':      { key: 'g', ctrl: true,  shift: false, alt: false, label: 'mode.gradient' },
  'mode.mirror':        { key: 'm', ctrl: true,  shift: false, alt: false, label: 'mode.mirror' },
  'mode.grid':          { key: "'", ctrl: true,  shift: false, alt: false, label: 'mode.grid' },
  'mode.animation':     { key: 'a', ctrl: true,  shift: true,  alt: false, label: 'mode.animation' },
  'mode.onionSkin':     { key: 'o', ctrl: true,  shift: false, alt: false, label: 'mode.onionSkin' },

  // Animation
  'anim.playPause':     { key: ' ', ctrl: false, shift: false, alt: false, label: 'anim.playPause' },
  'anim.prevFrame':     { key: 'arrowleft',  ctrl: false, shift: false, alt: false, label: 'anim.prevFrame' },
  'anim.nextFrame':     { key: 'arrowright', ctrl: false, shift: false, alt: false, label: 'anim.nextFrame' },
  'anim.firstFrame':    { key: 'home', ctrl: false, shift: false, alt: false, label: 'anim.firstFrame' },
  'anim.lastFrame':     { key: 'end',  ctrl: false, shift: false, alt: false, label: 'anim.lastFrame' },
  'anim.addFrame':      { key: 'n', ctrl: true,  shift: true,  alt: false, label: 'anim.addFrame' },
  'anim.deleteFrame':   { key: 'delete', ctrl: true,  shift: true,  alt: false, label: 'anim.deleteFrame' },

  // Layers
  'layer.add':          { key: 'l', ctrl: true,  shift: true,  alt: false, label: 'layer.add' },
  'layer.remove':       { key: 'delete', ctrl: true,  shift: true,  alt: false, label: 'layer.remove' },
  'layer.moveUp':       { key: ']', ctrl: true,  shift: false, alt: false, label: 'layer.moveUp' },
  'layer.moveDown':     { key: '[', ctrl: true,  shift: false, alt: false, label: 'layer.moveDown' },

  // Transforms
  'transform.rotate':   { key: 'r', ctrl: true,  shift: false, alt: false, label: 'transform.rotate' },
  'transform.flipH':    { key: 'h', ctrl: true,  shift: false, alt: false, label: 'transform.flipH' },
  'transform.flipV':    { key: 'v', ctrl: true,  shift: false, alt: false, label: 'transform.flipV' },
  'transform.trim':     { key: 't', ctrl: true,  shift: false, alt: false, label: 'transform.trim' },
};

export const SHORTCUT_CATEGORIES = {
  tools:      { id: 'tools',      label: 'shortcuts.cat.tools',      labelEn: 'Drawing Tools' },
  actions:    { id: 'actions',    label: 'shortcuts.cat.actions',    labelEn: 'Actions' },
  zoom:       { id: 'zoom',       label: 'shortcuts.cat.zoom',       labelEn: 'Zoom' },
  modes:      { id: 'modes',      label: 'shortcuts.cat.modes',      labelEn: 'Modes' },
  animation:  { id: 'animation',  label: 'shortcuts.cat.animation',  labelEn: 'Animation' },
  layers:     { id: 'layers',     label: 'shortcuts.cat.layers',     labelEn: 'Layers' },
  transforms: { id: 'transforms', label: 'shortcuts.cat.transforms', labelEn: 'Transforms' },
};

// Map singular prefix → plural category id
const PREFIX_TO_CATEGORY = {
  tool:       'tools',
  action:     'actions',
  zoom:       'zoom',
  mode:       'modes',
  anim:       'animation',
  layer:      'layers',
  transform:  'transforms',
};

export function getCategoryForShortcut(shortcutId) {
  const prefix = shortcutId.split('.')[0];
  const catId = PREFIX_TO_CATEGORY[prefix] || 'actions';
  return SHORTCUT_CATEGORIES[catId] || SHORTCUT_CATEGORIES.actions;
}

export function loadUserShortcuts() {
  try {
    const saved = localStorage.getItem('pixel-edit-shortcuts');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Normalize all keys to lowercase to ensure matching works
      const normalized = {};
      for (const [id, config] of Object.entries(parsed)) {
        if (config && config.key) {
          normalized[id] = { ...config, key: config.key.toLowerCase() };
        }
      }
      return { ...DEFAULT_SHORTCUTS, ...normalized };
    }
  } catch (e) {
    console.warn('[shortcuts] Failed to load user shortcuts:', e);
  }
  return { ...DEFAULT_SHORTCUTS };
}

export function saveUserShortcuts(shortcuts) {
  try {
    localStorage.setItem('pixel-edit-shortcuts', JSON.stringify(shortcuts));
  } catch (e) {
    console.warn('[shortcuts] Failed to save user shortcuts:', e);
  }
}

export function resetShortcutsToDefault() {
  localStorage.removeItem('pixel-edit-shortcuts');
  return { ...DEFAULT_SHORTCUTS };
}

/**
 * Convert a shortcut config object to a human-readable string, e.g. "Ctrl+Z"
 */
export function getShortcutDisplayString(config) {
  if (!config) return '';
  const parts = [];
  if (config.ctrl)  parts.push('Ctrl');
  if (config.shift) parts.push('Shift');
  if (config.alt)   parts.push('Alt');

  let key = config.key ?? '';
  if (key === ' ')           key = 'Space';
  else if (key === 'delete') key = 'Del';
  else if (key === 'arrowleft')  key = '←';
  else if (key === 'arrowright') key = '→';
  else if (key === 'arrowup')    key = '↑';
  else if (key === 'arrowdown')  key = '↓';
  else if (key === 'home')   key = 'Home';
  else if (key === 'end')    key = 'End';
  else                       key = key.toUpperCase();

  parts.push(key);
  return parts.join('+');
}

/**
 * Detect conflicts: returns array of {id, label, config} for existing shortcuts
 * that match newConfig, excluding the shortcut being edited (excludeShortcutId).
 */
export function detectConflicts(shortcuts, newConfig, excludeShortcutId = null) {
  const conflicts = [];
  // Normalize the new config key to lowercase for consistent comparison
  const normalizedKey = (newConfig.key || '').toLowerCase();
  
  for (const [id, shortcut] of Object.entries(shortcuts)) {
    if (id === excludeShortcutId) continue;
    if (
      shortcut.key === normalizedKey &&
      !!shortcut.ctrl  === !!newConfig.ctrl  &&
      !!shortcut.shift === !!newConfig.shift &&
      !!shortcut.alt   === !!newConfig.alt
    ) {
      conflicts.push({ id, label: shortcut.label || id, config: shortcut });
    }
  }
  return conflicts;
}
