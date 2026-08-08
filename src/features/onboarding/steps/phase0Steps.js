// phase0Steps.js — Phase 0: Chào mừng & Lời mời Onboarding
// Gồm 2 step: hộp thoại chào mừng + giới thiệu nhanh cách dùng.

export const phase0Steps = [
  {
    id: 'step-000',
    phase: 'phase-0',
    titleKey: 'onboarding.phase0.step000.title',
    bodyKey: 'onboarding.phase0.step000.body',
    selector: null, // Không target — hiển thị modal trung tâm
    position: 'center',
    highlightType: 'none',
    showBack: false,
    showSkip: true,
  },
  {
    id: 'step-001',
    phase: 'phase-0',
    titleKey: 'onboarding.phase0.step001.title',
    bodyKey: 'onboarding.phase0.step001.body',
    selector: '.container',
    position: 'center',
    highlightType: 'none',
    showBack: false,
    showSkip: true,
  },
];