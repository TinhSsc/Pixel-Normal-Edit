import React, { useState, useEffect, useCallback } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons/index.js';
import { t } from '../../../../i18n/i18n.js';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  loadUserShortcuts,
  saveUserShortcuts,
  getShortcutDisplayString,
  detectConflicts,
  resetShortcutsToDefault,
  getCategoryForShortcut,
} from '../../engine/core/shortcuts-config.js';
import {
  getShortcuts,
  updateShortcut,
  resetShortcutsToDefault as resetKeyboardShortcuts,
} from '../../engine/actions/keyboard-shortcuts.js';

export default function KeyboardShortcutsTab() {
  const [shortcuts, setShortcuts] = useState(() => loadUserShortcuts());
  const [editingId, setEditingId]   = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [activeCategory, setActiveCategory]   = useState('tools');
  const [isRecording, setIsRecording] = useState(false);

  // Sync when another component updates shortcuts via event
  useEffect(() => {
    const handleUpdate = () => setShortcuts(loadUserShortcuts());
    window.addEventListener('shortcuts-updated', handleUpdate);
    return () => window.removeEventListener('shortcuts-updated', handleUpdate);
  }, []);

  /* ------ Editing ------ */

  const handleEditClick = (shortcutId) => {
    setEditingId(shortcutId);
    setConflictWarning(null);
    setIsRecording(true);
  };

  const handleRecordKeyDown = useCallback((e, shortcutId) => {
    if (!isRecording) return;

    // Escape cancels
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
      return;
    }

    // Ignore pure modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    e.preventDefault();

    const newConfig = {
      key:   e.key.toLowerCase(),
      ctrl:  e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt:   e.altKey,
    };

    const currentShortcuts = getShortcuts();
    const conflicts = detectConflicts(currentShortcuts, newConfig, shortcutId);

    if (conflicts.length > 0) {
      setConflictWarning({ newConfig, conflicts, shortcutId });
      return;
    }

    applyShortcut(shortcutId, newConfig);
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyShortcut(shortcutId, newConfig) {
    updateShortcut(shortcutId, newConfig);
    setShortcuts(getShortcuts());
    setEditingId(null);
    setIsRecording(false);
    setConflictWarning(null);
  }

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsRecording(false);
    setConflictWarning(null);
  };

  /* ------ Conflict resolution ------ */

  const handleOverrideConflict = () => {
    if (!conflictWarning) return;
    const { newConfig, conflicts, shortcutId } = conflictWarning;

    // Reset conflicting entries to their defaults so they are no longer bound
    conflicts.forEach(conflict => {
      const def = DEFAULT_SHORTCUTS[conflict.id];
      if (def) updateShortcut(conflict.id, def);
    });

    applyShortcut(shortcutId, newConfig);
  };

  /* ------ Reset All ------ */

  const handleResetAll = () => {
    if (window.confirm(t('shortcuts.confirmReset') || 'Khôi phục tất cả phím tắt về mặc định?')) {
      resetShortcutsToDefault();
      resetKeyboardShortcuts();
      setShortcuts(getShortcuts());
    }
  };

  /* ------ Import / Export ------ */

  const handleExport = () => {
    const data = JSON.stringify(shortcuts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'keyboard-shortcuts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const valid = {};
        for (const [id, config] of Object.entries(imported)) {
          if (DEFAULT_SHORTCUTS[id] && config.key) valid[id] = config;
        }
        saveUserShortcuts(valid);
        window.dispatchEvent(new Event('shortcuts-updated'));
        setShortcuts(loadUserShortcuts());
      } catch {
        alert(t('shortcuts.importError') || 'Lỗi khi import file');
      }
    };
    reader.readAsText(file);
  };

  /* ------ Group shortcuts by category ------ */

  const groupedShortcuts = Object.entries(shortcuts).reduce((acc, [id, config]) => {
    const catId = getCategoryForShortcut(id).id;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push({ id, ...config });
    return acc;
  }, {});

  /* ------ Render ------ */

  return (
    <div className="shortcuts-tab">
      {/* Header */}
      <div className="shortcuts-header">
        <h3 className="shortcuts-title">
          {t('shortcuts.title') || 'Phím tắt'}
        </h3>
        <div className="shortcuts-actions">
          <button className="btn shortcuts-btn-icon" onClick={handleExport} title={t('shortcuts.export') || 'Xuất'}>
            <Icon name={ICONS.DOWNLOAD} style={{ width: 14, height: 14 }} />
            <span>{t('shortcuts.export') || 'Xuất'}</span>
          </button>
          <label className="btn shortcuts-btn-icon" title={t('shortcuts.import') || 'Nhập'} style={{ cursor: 'pointer' }}>
            <Icon name={ICONS.UPLOAD} style={{ width: 14, height: 14 }} />
            <span>{t('shortcuts.import') || 'Nhập'}</span>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button
            className="btn shortcuts-btn-danger"
            onClick={handleResetAll}
          >
            {t('shortcuts.resetAll') || 'Khôi phục mặc định'}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="shortcuts-category-tabs">
        {Object.values(SHORTCUT_CATEGORIES).map(cat => (
          <button
            key={cat.id}
            className={`tab-btn shortcuts-cat-btn${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {t(cat.label) || cat.labelEn}
          </button>
        ))}
      </div>

      {/* Shortcuts list */}
      <div className="shortcuts-list-wrapper">
        {(groupedShortcuts[activeCategory] || []).length === 0 && (
          <div className="shortcuts-empty">{t('keyboardShortcuts.emptyCategory')}</div>
        )}
        {(groupedShortcuts[activeCategory] || []).map(({ id, label, key, ctrl, shift, alt }) => {
          const isEditing = editingId === id;
          return (
            <div
              key={id}
              className={`shortcut-item${isEditing ? ' shortcut-item--editing' : ''}`}
            >
              <span className="shortcut-label">
                {t(label) || label}
              </span>

              {isEditing ? (
                <div className="shortcut-keys">
                  <div
                    className="shortcut-recording"
                    onKeyDown={(e) => handleRecordKeyDown(e, id)}
                    tabIndex={0}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  >
                    {t('shortcuts.pressKey') || 'Nhấn phím...'}
                  </div>
                  <button className="btn" onClick={handleCancelEdit} style={{ padding: '4px 8px', fontSize: 12 }}>
                    {t('btn.cancel') || 'Hủy'}
                  </button>
                </div>
              ) : (
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">
                    {getShortcutDisplayString({ key, ctrl, shift, alt })}
                  </kbd>
                  <button
                    className="btn shortcut-edit-btn"
                    onClick={() => handleEditClick(id)}
                  >
                    {t('shortcuts.edit') || 'Sửa'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conflict warning */}
      {conflictWarning && (
        <div className="conflict-warning">
          <div className="conflict-warning__title">
            <Icon name={ICONS.ALERT_TRIANGLE || 'triangle-alert'} style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'middle' }} />
            {t('shortcuts.conflictTitle') || 'Xung đột phím tắt'}
          </div>
          <p className="conflict-warning__desc">
            {t('shortcuts.conflictDesc') || 'Phím tắt này đang được sử dụng bởi:'}
          </p>
          <ul className="conflict-warning__list">
            {conflictWarning.conflicts.map(conflict => (
              <li key={conflict.id}>{t(conflict.label) || conflict.label}</li>
            ))}
          </ul>
          <div className="conflict-buttons">
            <button className="btn btn-primary" onClick={handleOverrideConflict} style={{ fontSize: 12, padding: '6px 12px' }}>
              {t('shortcuts.override') || 'Ghi đè'}
            </button>
            <button className="btn" onClick={handleCancelEdit} style={{ fontSize: 12, padding: '6px 12px' }}>
              {t('btn.cancel') || 'Hủy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
