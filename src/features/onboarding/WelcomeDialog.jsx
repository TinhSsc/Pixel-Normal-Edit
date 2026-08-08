import { Icon, ICONS } from '../../shared/ui/icons/index.js';
import { t } from '../../i18n/i18n.js';
import { useOnboarding } from './hooks/useOnboarding.js';

/**
 * Hộp thoại chào hỏi đầu tiên.
 * Hỏi người dùng: "Bạn đã biết sử dụng Pixel Normal Edit chưa?"
 * - "Tôi chưa biết – Hướng dẫn tôi" → startOnboarding()
 * - "Tôi biết rồi – Bỏ qua" → dismissWelcome()
 */
export default function WelcomeDialog() {
  const { startOnboarding, dismissWelcome } = useOnboarding();

  return (
    <div className="onboarding-welcome-overlay" role="dialog" aria-modal="true" aria-label={t('onboarding.welcome.title')}>
      <div className="onboarding-welcome-card">
        <div className="onboarding-welcome-logo">
          <img src="/avatar.svg" alt="Pixel Normal Edit Logo" width="56" height="56" />
        </div>

        <h2 className="onboarding-welcome-title">{t('onboarding.welcome.title')}</h2>

        <p className="onboarding-welcome-desc">{t('onboarding.welcome.desc')}</p>

        <ul className="onboarding-welcome-features">
          <li>
            <Icon name={ICONS.PENCIL} style={{ width: 16, height: 16 }} />
            <span>{t('onboarding.welcome.feature1')}</span>
          </li>
          <li>
            <Icon name={ICONS.ARROW_LEFT_RIGHT} style={{ width: 16, height: 16 }} />
            <span>{t('onboarding.welcome.feature2')}</span>
          </li>
          <li>
            <Icon name={ICONS.FILM} style={{ width: 16, height: 16 }} />
            <span>{t('onboarding.welcome.feature3')}</span>
          </li>
        </ul>

        <p className="onboarding-welcome-question">{t('onboarding.welcome.question')}</p>

        <div className="onboarding-welcome-actions">
          <button
            type="button"
            className="btn btn-primary onboarding-welcome-btn-guide"
            onClick={startOnboarding}
          >
            <Icon name={ICONS.ZAP} style={{ width: 18, height: 18 }} />
            <span>{t('onboarding.welcome.optionGuide')}</span>
          </button>

          <button
            type="button"
            className="btn onboarding-welcome-btn-skip"
            onClick={dismissWelcome}
          >
            <Icon name={ICONS.CHECK} style={{ width: 18, height: 18 }} />
            <span>{t('onboarding.welcome.optionSkip')}</span>
          </button>
        </div>

        <p className="onboarding-welcome-sub">{t('onboarding.welcome.sub')}</p>
      </div>
    </div>
  );
}