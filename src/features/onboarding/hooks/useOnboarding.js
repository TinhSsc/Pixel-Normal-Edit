import { useContext } from 'react';
import { OnboardingContext } from '../OnboardingContext.js';

/**
 * Hook truy cập trạng thái onboarding từ bất kỳ component nào.
 * Cách dùng: const { isOpen, nextStep, ... } = useOnboarding();
 */
export function useOnboarding() {
  return useContext(OnboardingContext);
}