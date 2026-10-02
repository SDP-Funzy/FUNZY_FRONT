'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { HOME_PATH, LOGIN_PATH } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/auth/useAuth';
import { hasSeenOnboarding } from '@/lib/onboardingFlag';

const ONBOARDING_PATH = '/onboarding';

/**
 * 앱 첫 진입 (/)
 * 로그인 상태면 홈, 아니면 온보딩을 본 적 있으면 로그인, 처음이면 온보딩으로 보낸다.
 */
const EntryPage = () => {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      router.replace(HOME_PATH);
      return;
    }
    router.replace(hasSeenOnboarding() ? LOGIN_PATH : ONBOARDING_PATH);
  }, [status, router]);

  return null;
};

export default EntryPage;
