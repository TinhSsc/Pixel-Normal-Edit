import React, { useEffect, useRef, useState } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { getCurrentLang, t } from '../../../../i18n/i18n.js';
import { GRID_WIDTH, GRID_HEIGHT, setStatus } from '../../engine/core/state.js';
import { renderPixels, setForceFullRender } from '../../engine/core/render.js';
import {
  applySelectionRatio,
  getSelectionComparisonState,
  resetSelectionComparison,
  selectEntireCanvasAsMain,
  setMainReferenceSize,
  setSelectionComparisonEnabled,
  setSelectionComparisonTarget,
  subscribeSelectionComparison,
} from '../../engine/core/selection-comparison.js';
import { calculateSelectionComparison, calculateSelectionSizes, SELECTION_RATIO_PRESETS } from '../../engine/core/selection-ratio.js';
import {
  getQuickColorSelectState,
  resetQuickColorSelect,
  setQuickColorSelectOptions,
  subscribeQuickColorSelect,
  toggleQuickColorSelect,
} from '../../engine/core/quick-color-select.js';

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat(getCurrentLang(), { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${new Intl.NumberFormat(getCurrentLang(), { maximumFractionDigits: 2 }).format(value)}%`;
}

function formatCellRange(range) {
  if (!range) return '—';
  const rowLabel = t('selectionRatio.rowShort');
  const columnLabel = t('selectionRatio.columnShort');
  const start = `${rowLabel}${range.startRow}/${columnLabel}${range.startCol}`;
  const end = `${rowLabel}${range.endRow}/${columnLabel}${range.endCol}`;
  return `${start} → ${end}`;
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the synchronous fallback below.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error(t('selectionRatio.copyFailed'));
}

export default function SelectionComparisonPanel() {
  const [comparison, setComparison] = useState(getSelectionComparisonState);
  const [copyState, setCopyState] = useState('idle');
  const [copiedRange, setCopiedRange] = useState(null);
  const [quick, setQuick] = useState(getQuickColorSelectState());
  const [referenceWidthDraft, setReferenceWidthDraft] = useState('');
  const [referenceHeightDraft, setReferenceHeightDraft] = useState('');
  const copyResetTimer = useRef(null);
  const rangeCopyResetTimer = useRef(null);
  const comparisonReferenceWidth = comparison.mainReference?.width;
  const comparisonReferenceHeight = comparison.mainReference?.height;
  const comparisonEnabled = comparison.enabled;
  const hasReference = Boolean(comparison.mainReference);

  useEffect(() => subscribeSelectionComparison(setComparison), []);

  useEffect(() => subscribeQuickColorSelect(setQuick), []);

  useEffect(() => {
    if (!comparisonEnabled) return undefined;
    const timer = setTimeout(() => window.lucide?.createIcons?.(), 0);
    return () => clearTimeout(timer);
  }, [comparisonEnabled, hasReference]);

  useEffect(() => {
    setReferenceWidthDraft(comparisonReferenceWidth ? String(comparisonReferenceWidth) : '');
    setReferenceHeightDraft(comparisonReferenceHeight ? String(comparisonReferenceHeight) : '');
  }, [comparisonReferenceWidth, comparisonReferenceHeight]);

  useEffect(() => () => {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    if (rangeCopyResetTimer.current) clearTimeout(rangeCopyResetTimer.current);
  }, []);

  if (!comparison.enabled) return null;

  const sizes = calculateSelectionSizes(comparison.mainBox, comparison.compareBox, comparison.mainReference);
  const stats = calculateSelectionComparison(comparison.mainBox, comparison.compareBox, comparison.mainReference);
  const parsedReferenceWidth = Number.parseInt(referenceWidthDraft, 10);
  const parsedReferenceHeight = Number.parseInt(referenceHeightDraft, 10);
  const canApplyReference = Number.isInteger(parsedReferenceWidth) && parsedReferenceWidth > 0
    && Number.isInteger(parsedReferenceHeight) && parsedReferenceHeight > 0;

  const redrawCanvas = () => {
    setForceFullRender(true);
    renderPixels();
  };

  const handleTargetChange = (target) => {
    setSelectionComparisonTarget(target);
    redrawCanvas();
  };

  const handleSelectAll = () => {
    selectEntireCanvasAsMain(GRID_WIDTH, GRID_HEIGHT);
    redrawCanvas();
  };

  const handleReset = () => {
    resetQuickColorSelect();
    resetSelectionComparison();
    redrawCanvas();
  };

  const handleApplyReference = () => {
    if (!canApplyReference) return;
    setMainReferenceSize(parsedReferenceWidth, parsedReferenceHeight);
  };

  const handleClearReference = () => {
    setReferenceWidthDraft('');
    setReferenceHeightDraft('');
    setMainReferenceSize(null, null);
  };

  const handleClose = () => {
    setSelectionComparisonEnabled(false);
    redrawCanvas();
  };

  const handlePreset = (preset) => {
    applySelectionRatio(preset.numerator, preset.denominator);
    redrawCanvas();
  };

  const handleCopy = async () => {
    if (!comparison.mainBox || !comparison.compareBox || !stats) return;

    const summary = [
      t('selectionRatio.title'),
      `${t('selectionRatio.main')}: ${comparison.mainBox.width} × ${comparison.mainBox.height}`,
      `${t('selectionRatio.compare')}: ${comparison.compareBox.width} × ${comparison.compareBox.height}`,
      `${t('selectionRatio.mainRange')}: ${formatCellRange(sizes?.mainRange)}`,
      `${t('selectionRatio.compareRange')}: ${formatCellRange(sizes?.compareRange)}`,
    ];

    if (sizes?.usesReference) {
      summary.push(
        `${t('selectionRatio.main')} ${t('selectionRatio.reference')}: ${sizes.mainSize.width} × ${sizes.mainSize.height} — ${formatNumber(stats.mainArea)} ${t('selectionRatio.pixels')}`,
        `${t('selectionRatio.compare')} ${t('selectionRatio.reference')}: ${sizes.compareSize.width} × ${sizes.compareSize.height} — ${formatNumber(stats.compareArea)} ${t('selectionRatio.pixels')}`
      );
    } else {
      summary.push(
        `${t('selectionRatio.main')}: ${formatNumber(stats.mainArea)} ${t('selectionRatio.pixels')}`,
        `${t('selectionRatio.compare')}: ${formatNumber(stats.compareArea)} ${t('selectionRatio.pixels')}`
      );
    }

    summary.push(
      `${t('selectionRatio.widthRatio')}: ${formatPercent(stats.widthPercent)}`,
      `${t('selectionRatio.heightRatio')}: ${formatPercent(stats.heightPercent)}`,
      `${t('selectionRatio.areaRatio')}: ${formatPercent(stats.areaPercent)}`,
      `${t('selectionRatio.pixelDifference')}: ${formatNumber(stats.pixelDifference)} ${t('selectionRatio.pixels')}`
    );

    try {
      await writeClipboardText(summary.join('\n'));
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopyState('idle'), 1800);
  };

  const handleCopyRange = async (target, label, range) => {
    if (!range) return;
    const text = `${label}: ${formatCellRange(range)}`;

    try {
      await writeClipboardText(text);
      setCopiedRange(target);
      setStatus(t('selectionRatio.rangeCopied', text));
    } catch {
      setCopiedRange(null);
      setStatus(t('selectionRatio.copyFailed'), true);
    }

    if (rangeCopyResetTimer.current) clearTimeout(rangeCopyResetTimer.current);
    rangeCopyResetTimer.current = setTimeout(() => setCopiedRange(null), 1400);
  };

  let hintKey = 'selectionRatio.hintEdit';
  if (!comparison.mainBox) hintKey = 'selectionRatio.hintMain';
  else if (!comparison.compareBox) hintKey = 'selectionRatio.hintCompare';

  return (
    <section
      className="selection-comparison-ui"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      aria-label={t('selectionRatio.title')}
    >
      <header className="selection-comparison-header">
        <div className="selection-comparison-title">
          <Icon name={ICONS.LAYOUT_GRID} />
          <span>{t('selectionRatio.title')}</span>
        </div>
        <button type="button" className="selection-comparison-close" onClick={handleClose} title={t('selectionRatio.close')} aria-label={t('selectionRatio.close')}>
          <Icon name={ICONS.X} />
        </button>
      </header>

      <p className="selection-comparison-hint">{t(hintKey)}</p>

      <div className="selection-comparison-actions">
        <button type="button" className="btn" onClick={handleSelectAll}>{t('selectionRatio.selectAll')}</button>
        <button type="button" className="btn" onClick={handleReset} disabled={!comparison.mainBox && !comparison.compareBox && !comparison.mainReference}>{t('selectionRatio.reset')}</button>
      </div>

      <div className="selection-comparison-reference" title={t('selectionRatio.referenceHint')}>
        <div className="selection-comparison-reference-title">{t('selectionRatio.referenceTitle')}</div>
        <div className="selection-comparison-reference-row">
          <input
            type="number"
            min="1"
            max="99999"
            inputMode="numeric"
            value={referenceWidthDraft}
            onChange={(event) => setReferenceWidthDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') handleApplyReference(); }}
            placeholder={comparison.mainBox ? String(comparison.mainBox.width) : 'W'}
            aria-label={t('label.width')}
          />
          <span>×</span>
          <input
            type="number"
            min="1"
            max="99999"
            inputMode="numeric"
            value={referenceHeightDraft}
            onChange={(event) => setReferenceHeightDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') handleApplyReference(); }}
            placeholder={comparison.mainBox ? String(comparison.mainBox.height) : 'H'}
            aria-label={t('label.height')}
          />
          <button
            type="button"
            onClick={handleApplyReference}
            disabled={!canApplyReference}
            title={t('selectionRatio.applyReference')}
            aria-label={t('selectionRatio.applyReference')}
          >
            <Icon name={ICONS.CHECK} />
          </button>
          {comparison.mainReference && (
            <button
              type="button"
              onClick={handleClearReference}
              title={t('selectionRatio.clearReference')}
              aria-label={t('selectionRatio.clearReference')}
            >
              <Icon name={ICONS.X} />
            </button>
          )}
        </div>
      </div>

      <div className="selection-comparison-cards">
        <button
          type="button"
          className={`selection-comparison-card main${comparison.activeTarget === 'main' ? ' active' : ''}`}
          onClick={() => handleTargetChange('main')}
          disabled={!comparison.mainBox}
        >
          <span className="selection-comparison-card-label"><i />{t('selectionRatio.main')}</span>
          <strong>{comparison.mainBox ? `${comparison.mainBox.width} × ${comparison.mainBox.height}` : t('selectionRatio.notSelected')}</strong>
          <small>
            {comparison.mainBox
              ? sizes?.usesReference
                ? `${t('selectionRatio.reference')}: ${sizes.mainSize.width} × ${sizes.mainSize.height} — ${formatNumber(sizes.mainArea)} ${t('selectionRatio.pixels')}`
                : `${formatNumber(sizes?.mainArea || comparison.mainBox.width * comparison.mainBox.height)} ${t('selectionRatio.pixels')}`
              : t('selectionRatio.hintMain')}
          </small>
        </button>

        <button
          type="button"
          className={`selection-comparison-card compare${comparison.activeTarget === 'compare' ? ' active' : ''}`}
          onClick={() => handleTargetChange('compare')}
          disabled={!comparison.compareBox}
        >
          <span className="selection-comparison-card-label"><i />{t('selectionRatio.compare')}</span>
          <strong>{comparison.compareBox ? `${comparison.compareBox.width} × ${comparison.compareBox.height}` : t('selectionRatio.notSelected')}</strong>
          <small>
            {comparison.compareBox
              ? sizes?.usesReference
                ? `${t('selectionRatio.reference')}: ${sizes.compareSize.width} × ${sizes.compareSize.height} — ${formatNumber(sizes.compareArea)} ${t('selectionRatio.pixels')}`
                : `${formatNumber(sizes?.compareArea || comparison.compareBox.width * comparison.compareBox.height)} ${t('selectionRatio.pixels')}`
              : t('selectionRatio.hintCompare')}
          </small>
        </button>
      </div>

      <div className="selection-comparison-section-title">{t('selectionRatio.rangeTitle')}</div>
      <div className="selection-comparison-ranges" title={t('selectionRatio.rangeHint')}>
        <button
          type="button"
          className={copiedRange === 'main' ? 'copied' : ''}
          onClick={() => handleCopyRange('main', t('selectionRatio.main'), sizes?.mainRange)}
          disabled={!sizes?.mainRange}
          aria-label={`${t('selectionRatio.copyRange')}: ${t('selectionRatio.main')}`}
        >
          <span>{t('selectionRatio.main')}</span>
          <span className="selection-comparison-range-value">
            <strong>{formatCellRange(sizes?.mainRange)}</strong>
            <Icon name={ICONS.COPY} />
          </span>
        </button>
        <button
          type="button"
          className={copiedRange === 'compare' ? 'copied' : ''}
          onClick={() => handleCopyRange('compare', t('selectionRatio.compare'), sizes?.compareRange)}
          disabled={!sizes?.compareRange}
          aria-label={`${t('selectionRatio.copyRange')}: ${t('selectionRatio.compare')}`}
        >
          <span>{t('selectionRatio.compare')}</span>
          <span className="selection-comparison-range-value">
            <strong>{formatCellRange(sizes?.compareRange)}</strong>
            <Icon name={ICONS.COPY} />
          </span>
        </button>
      </div>

      <div className="selection-comparison-section-title">{t('selectionRatio.quickSelectTitle')}</div>
      <div className="selection-comparison-quick">
        <button
          type="button"
          className={`selection-comparison-quick-arm${quick.armed ? ' armed' : ''}`}
          onClick={toggleQuickColorSelect}
          title={t('selectionRatio.quickSelectHint')}
        >
          <Icon name={ICONS.PIPETTE} />
          <span>{quick.armed ? t('selectionRatio.quickSelectArmed') : t('selectionRatio.quickSelectArm')}</span>
        </button>

        <div className="selection-comparison-quick-options">
          <div className="selection-comparison-quick-row">
            <span className="selection-comparison-quick-label">{t('selectionRatio.quickSelectTarget')}</span>
            <div className="selection-comparison-quick-toggle">
              <button
                type="button"
                className={quick.target === 'compare' ? 'active' : ''}
                onClick={() => setQuickColorSelectOptions({ target: 'compare' })}
                title={t('selectionRatio.compare')}
              >
                {t('selectionRatio.compare')}
              </button>
              <button
                type="button"
                className={quick.target === 'main' ? 'active' : ''}
                onClick={() => setQuickColorSelectOptions({ target: 'main' })}
                title={t('selectionRatio.main')}
              >
                {t('selectionRatio.main')}
              </button>
            </div>
          </div>

          <div className="selection-comparison-quick-row">
            <span className="selection-comparison-quick-label">{t('selectionRatio.quickSelectSpread')}</span>
            <div className="selection-comparison-quick-toggle">
              <button
                type="button"
                className={quick.contiguous ? 'active' : ''}
                onClick={() => setQuickColorSelectOptions({ contiguous: true })}
                title={t('selectionRatio.quickSelectContiguousHint')}
              >
                {t('selectionRatio.quickSelectContiguous')}
              </button>
              <button
                type="button"
                className={!quick.contiguous ? 'active' : ''}
                onClick={() => setQuickColorSelectOptions({ contiguous: false })}
                title={t('selectionRatio.quickSelectGlobalHint')}
              >
                {t('selectionRatio.quickSelectGlobal')}
              </button>
            </div>
          </div>

          <div className="selection-comparison-quick-row">
            <label className="selection-comparison-quick-label" htmlFor="quickSelectTolerance">
              {t('selectionRatio.quickSelectTolerance')}
            </label>
            <input
              id="quickSelectTolerance"
              type="number"
              min="0"
              max="255"
              step="1"
              inputMode="numeric"
              className="selection-comparison-quick-tolerance"
              value={quick.tolerance}
              onChange={(event) => setQuickColorSelectOptions({ tolerance: event.target.value })}
              title={t('selectionRatio.quickSelectToleranceHint')}
            />
          </div>
        </div>

        {quick.lastResult && (
          <div className="selection-comparison-quick-result">
            {t('selectionRatio.quickSelectResultShort', formatNumber(quick.lastResult.count), quick.lastResult.colorHex, `${quick.lastResult.box.width} × ${quick.lastResult.box.height}`)}
          </div>
        )}
      </div>

      <div className="selection-comparison-section-title">{t('selectionRatio.presetTitle')}</div>
      <div className="selection-comparison-presets">
        {SELECTION_RATIO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset)}
            disabled={!comparison.mainBox}
            title={`${preset.label} (${t('selectionRatio.axisRatio')})`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="selection-comparison-results" aria-live="polite">
        <div>
          <span>{t('selectionRatio.widthRatio')}</span>
          <strong>{stats ? formatPercent(stats.widthPercent) : '—'}</strong>
        </div>
        <div>
          <span>{t('selectionRatio.heightRatio')}</span>
          <strong>{stats ? formatPercent(stats.heightPercent) : '—'}</strong>
        </div>
        <div className="area" title={t('selectionRatio.areaNote')}>
          <span>{t('selectionRatio.areaRatio')}</span>
          <strong>{stats ? formatPercent(stats.areaPercent) : '—'}</strong>
        </div>
        <div>
          <span>{t('selectionRatio.pixelDifference')}</span>
          <strong>{stats ? `${formatNumber(stats.pixelDifference)} ${t('selectionRatio.pixels')}` : '—'}</strong>
        </div>
      </div>

      <button
        type="button"
        className={`btn selection-comparison-copy ${copyState}`}
        onClick={handleCopy}
        disabled={!stats}
      >
        {copyState === 'copied'
          ? t('selectionRatio.copied')
          : copyState === 'error'
            ? t('selectionRatio.copyFailed')
            : t('selectionRatio.copy')}
      </button>
    </section>
  );
}
