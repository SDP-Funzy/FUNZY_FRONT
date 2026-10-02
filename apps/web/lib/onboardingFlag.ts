const ONBOARDING_SEEN_KEY = 'funzy.onboardingSeen';

/** 온보딩을 끝까지 본 적이 있는지 (웹 화면 흐름용이라 core 가 아닌 web 에 둔다) */
export const hasSeenOnboarding = () => {
  try {
    return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markOnboardingSeen = () => {
  try {
    window.localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  } catch {
    // 저장이 막혀 있으면 다음에도 온보딩이 보일 뿐이라 조용히 넘어간다
  }
};
