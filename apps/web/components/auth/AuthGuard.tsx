'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/hooks/auth/useAuth';

export const HOME_PATH = '/home';
export const LOGIN_PATH = '/login';

type AuthGuardProps = {
  /** member: 로그인해야 볼 수 있는 화면 / guest: 로그인하지 않은 사람만 보는 화면 (온보딩, 로그인, 회원가입) */
  allow: 'member' | 'guest';
  children: ReactNode;
};

/**
 * 로그인 상태에 맞지 않는 화면이면 다른 화면으로 보낸다.
 * 확인 중이거나 이동할 때는 아무것도 그리지 않아서, 잘못된 화면이 잠깐 보이는 일이 없다.
 */
export const AuthGuard = ({ allow, children }: AuthGuardProps) => {
  const { status } = useAuth();
  const router = useRouter();

  const redirectTo =
    allow === 'member' && status === 'unauthenticated'
      ? LOGIN_PATH
      : allow === 'guest' && status === 'authenticated'
        ? HOME_PATH
        : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (status === 'loading' || redirectTo) return null;
  return children;
};
