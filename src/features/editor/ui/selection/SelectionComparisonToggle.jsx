import React, { useEffect, useState } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';
import { setCurrentTool } from '../../engine/core/state.js';
import { renderPixels, setForceFullRender } from '../../engine/core/render.js';
import { clearSelection } from '../../engine/tools/select.js';
import {
  isSelectionComparisonEnabled,
  setSelectionComparisonEnabled,
  subscribeSelectionComparison,
} from '../../engine/core/selection-comparison.js';

export default function SelectionComparisonToggle() {
  const [enabled, setEnabled] = useState(isSelectionComparisonEnabled);

  useEffect(() => subscribeSelectionComparison((state) => setEnabled(state.enabled)), []);

  const handleToggle = () => {
    if (enabled) {
      setSelectionComparisonEnabled(false);
    } else {
      clearSelection();
      setSelectionComparisonEnabled(true);
      setCurrentTool('select');
    }

    setForceFullRender(true);
    renderPixels();
  };

  return (
    <button
      type="button"
      id="selectionComparisonToggleBtn"
      className={`btn selection-comparison-toggle-btn${enabled ? ' active' : ''}`}
      onClick={handleToggle}
      data-i18n="tooltip.selectionRatio"
      title={t('tooltip.selectionRatio')}
      aria-pressed={enabled}
    >
      <Icon name={ICONS.LAYOUT_GRID} />
    </button>
  );
}
