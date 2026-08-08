import { Icon, ICONS } from '../../shared/ui/icons/index.js';
import { t } from '../../i18n/i18n.js';

/**
 * Ô vuông hướng dẫn (StepCard) — hiển thị nội dung + nút Next/Back/Skip + progress.
 * Dùng chung cho mọi step onboarding.
 */
export default function StepCard({ step, index, total, showBack, showSkip, onNext, onBack, onSkip }) {
  const title = step.titleKey ? t(step.titleKey) : step.title || '';
  const body = step.bodyKey ? t(step.bodyKey) : step.body || '';
  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="onboarding-stepcard" role="dialog" aria-modal="true" aria-label={title}>
      <div className="onboarding-stepcard-header">
        <span className="onboarding-stepcard-badge">{index + 1}/{total}</span>
        <span className="onboarding-stepcard-phase">{t('onboarding.phase0.name')}</span>
      </div>

      <h3 className="onboarding-stepcard-title">{title}</h3>
      <p className="onboarding-stepcard-body">{body}</p>

      <div className="onboarding-stepcard-progress">
        <div className="onboarding-stepcard-progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="onboarding-stepcard-actions">
        {showBack && (
          <button type="button" className="btn onboarding-stepcard-btn-back" onClick={onBack} aria-label={t('onboarding.buttons.back')}>
            <Icon name={ICONS.ARROW_LEFT} style={{ width: 16, height: 16 }} />
            <span>{t('onboarding.buttons.back')}</span>
          </button>
        )}

        {showSkip && (
          <button type="button" className="btn onboarding-stepcard-btn-skip" onClick={onSkip} aria-label={t('onboarding.buttons.skip')}>
            {t('onboarding.buttons.skip')}
          </button>
        )}

        <button type="button" className="btn btn-primary onboarding-stepcard-btn-next" onClick={onNext} aria-label={t('onboarding.buttons.next')}>
          <span>{t('onboarding.buttons.next')}</span>
          <Icon name={ICONS.ARROW_RIGHT} style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}