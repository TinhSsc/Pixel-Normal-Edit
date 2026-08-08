import { createContext } from 'react';

/**
 * Context onboarding — chia sẻ trạng thái giữa Toàn app.
 * state: 'idle' | 'welcome' | 'active' | 'paused' | 'completed' | 'skipped'
 */
export const OnboardingContext = createContext({
  state: 'idle',
  currentStep: 0,
  startOnboarding: () => {},
  skipOnboarding: () => {},
  dismissWelcome: () => {},
  nextStep: () => {},
  prevStep: () => {},
  pauseOnboarding: () => {},
  resumeOnboarding: () => {},
  isOpen: false,
});