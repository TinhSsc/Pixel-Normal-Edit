import React, { useEffect, useRef, useState } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';
import { setStatus } from '../../engine/core/state.js';

const COLOR_TARGETS = [
  { id: 'primary', inputId: 'colorPicker', tooltipKey: 'tooltip.copyPrimaryColor' },
  { id: 'secondary', inputId: 'colorPicker2', tooltipKey: 'tooltip.copySecondaryColor' },
];

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through for non-secure contexts or denied clipboard permissions.
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
  if (!copied) throw new Error(t('status.colorCopyFailed'));
}

export default function ColorCopyButtons() {
  const [values, setValues] = useState({ primary: '', secondary: '' });
  const [copiedId, setCopiedId] = useState(null);
  const resetTimer = useRef(null);

  useEffect(() => {
    const inputs = COLOR_TARGETS
      .map(({ inputId }) => document.getElementById(inputId))
      .filter(Boolean);

    const syncValues = () => {
      setValues({
        primary: document.getElementById('colorPicker')?.value || '',
        secondary: document.getElementById('colorPicker2')?.value || '',
      });
    };

    syncValues();
    inputs.forEach((input) => {
      input.addEventListener('input', syncValues);
      input.addEventListener('change', syncValues);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', syncValues);
        input.removeEventListener('change', syncValues);
      });
    };
  }, []);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = async (target) => {
    const value = document.getElementById(target.inputId)?.value;
    if (!value) return;

    try {
      await copyText(value);
      setCopiedId(target.id);
      setStatus(t('status.colorCopied', value));
    } catch {
      setCopiedId(null);
      setStatus(t('status.colorCopyFailed'), true);
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopiedId(null), 1400);
  };

  return (
    <div className="color-copy-stack" role="group" aria-label={t('colorPicker.copyGroup')}>
      {COLOR_TARGETS.map((target) => {
        const value = values[target.id] || '—';
        const isCopied = copiedId === target.id;
        const label = `${t(target.tooltipKey)}: ${value}`;
        return (
          <button
            key={target.id}
            type="button"
            className={`color-copy-btn${isCopied ? ' copied' : ''}`}
            onClick={() => handleCopy(target)}
            title={label}
            aria-label={label}
          >
            <Icon name={ICONS.COPY} />
            <span>{value}</span>
          </button>
        );
      })}
    </div>
  );
}
