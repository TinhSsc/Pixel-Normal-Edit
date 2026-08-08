import { useCallback, useEffect, useRef, useState } from 'react';
import { OnboardingContext } from './OnboardingContext.js';
import { allSteps } from './steps/index.js';
import { getOnboardingStep, markOnboardingDone, saveOnboardingStep, shouldShowOnboarding } from './utils/storage.js';

const WELCOME_DELAY = 400; // chờ editor render xong

/**
 * Provider quản lý toàn bộ trạng thái onboarding.
 * Bọc App/ToolsApp để mọi component có thể dùng useOnboarding().
 */
export default function OnboardingProvider({ children }) {
  const [state, setState] = useState('idle'); // idle | welcome | active | paused | completed | skipped
  const [currentStep, setCurrentStep] = useState(0);
  const inited = useRef(false);

  // Khởi tạo: quyết định hiện WelcomeDialog hay không
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    const timer = setTimeout(() => {
      if (shouldShowOnboarding()) {
        setState('welcome');
      }
    }, WELCOME_DELAY);

    return () => clearTimeout(timer);
  }, []);

  // Bắt đầu onboarding từ step đã lưu (hoặc 0)
  const startOnboarding = useCallback(() => {
    const saved = getOnboardingStep();
    const max = Math.max(0, allSteps.length - 1);
    const start = Math.min(saved, max);
    setCurrentStep(start);
    setState('active');
  }, []);

  // Bỏ qua hoàn toàn (bấm Skip / "Tôi biết rồi")
  const skipOnboarding = useCallback(() => {
    markOnboardingDone(true);
    setState('skipped');
  }, []);

  // Đóng WelcomeDialog khi người dùng chọn "Tôi biết rồi"
  const dismissWelcome = useCallback(() => {
    skipOnboarding();
  }, [skipOnboarding]);

  // Đi tiếp 1 bước
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= allSteps.length) {
        // Hết step → hoàn thành
        markOnboardingDone(false);
        setState('completed');
        return prev;
      }
      saveOnboardingStep(next);
      return next;
    });
  }, []);

  // Quay lại 1 bước
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const back = prev - 1;
      if (back < 0) return 0;
      saveOnboardingStep(back);
      return back;
    });
  }, []);

  // Tạm dừng (Esc / tab ẩn)
  const pauseOnboarding = useCallback(() => {
    setState((s) => (s === 'active' ? 'paused' : s));
  }, []);

  // Tiếp tục
  const resumeOnboarding = useCallback(() => {
    setState('active');
  }, []);

  // Lắng nghe phím Esc khi đang active
  useEffect(() => {
    if (state !== 'active') return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        pauseOnboarding();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, pauseOnboarding]);

  const value = {
    state,
    currentStep,
    isOpen: state === 'welcome' || state === 'active',
    isActive: state === 'active',
    totalSteps: allSteps.length,
    currentStepData: allSteps[currentStep] || null,
    startOnboarding,
    skipOnboarding,
    dismissWelcome,
    nextStep,
    prevStep,
    pauseOnboarding,
    resumeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}