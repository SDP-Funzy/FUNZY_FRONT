import type { Metadata } from 'next';

import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';

export const metadata: Metadata = {
  title: '펀지 소개 | Funzy',
};

const OnboardingPage = () => {
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <OnboardingCarousel />
    </div>
  );
};

export default OnboardingPage;
