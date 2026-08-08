// storage.js — Quản lý trạng thái onboarding trong localStorage
const KEYS = {
  DONE: 'pne_onboarding_done',
  STEP: 'pne_onboarding_step',
  PHASE: 'pne_onboarding_phase',
  VERSION: 'pne_onboarding_version',
};

const ONBOARDING_VERSION = '1';

/**
 * Kiểm tra xem có nên hiển thị onboarding không.
 * - Nếu version thay đổi → reset, hiện lại.
 * - Nếu chưa có key DONE → hiện.
 * - Nếu đã '1' hoặc 'skip' → không hiện.
 */
export function shouldShowOnboarding() {
  try {
    if (localStorage.getItem(KEYS.VERSION) !== ONBOARDING_VERSION) {
      return true;
    }
    return !localStorage.getItem(KEYS.DONE);
  } catch (e) {
    return false;
  }
}

/**
 * Đánh dấu đã hoàn thành (hoặc bỏ qua) onboarding.
 * @param {boolean} skip - true nếu người dùng bỏ qua.
 */
export function markOnboardingDone(skip = false) {
  try {
    localStorage.setItem(KEYS.DONE, skip ? 'skip' : '1');
    localStorage.setItem(KEYS.VERSION, ONBOARDING_VERSION);
  } catch (e) {
    // ignore
  }
}

/* Lưu step hiện tại khi refresh giữa chừng */
export function saveOnboardingStep(stepIndex) {
  try {
    localStorage.setItem(KEYS.STEP, String(stepIndex));
  } catch (e) {
    // ignore
  }
}

export function getOnboardingStep() {
  try {
    const v = localStorage.getItem(KEYS.STEP);
    return v ? parseInt(v, 10) : 0;
  } catch (e) {
    return 0;
  }
}

/* Reset hoàn toàn onboarding (dùng khi "Xem lại hướng dẫn") */
export function resetOnboarding() {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}