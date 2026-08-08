// steps/index.js — Registry tổng hợp các bước onboarding
import { phase0Steps } from './phase0Steps.js';

// Danh sách step theo từng phase (Phase 0 trước)
export const phases = {
  'phase-0': {
    id: 'phase-0',
    nameKey: 'onboarding.phase0.name',
    descriptionKey: 'onboarding.phase0.description',
    steps: phase0Steps,
  },
};

// Toàn bộ step nối tiếp theo thứ tự phase
export const allSteps = [
  ...phase0Steps,
];

// Lấy danh sách step theo tên phase
export const getStepsByPhase = (phaseId) => {
  const phase = phases[phaseId];
  return phase ? phase.steps : [];
};