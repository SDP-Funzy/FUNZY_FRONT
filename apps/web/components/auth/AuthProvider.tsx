'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { hasSession, logout as logoutUseCase } from '@/lib/authService';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  status: AuthStatus;
  /** 로그인 성공 후 호출 (토큰 저장은 로그인 유스케이스가 함) */
  markLoggedIn: () => void;
  /** 복구 API가 세션을 종료하고 저장된 토큰을 지운 뒤 호출 */
  markLoggedOut: () => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 앱 전체의 로그인 상태
 * 토큰이 브라우저 저장소에 있어서, 화면이 열린 뒤 확인하기 전까지는 'loading' 이다.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let isCancelled = false;
    hasSession().then((isLoggedIn) => {
      if (!isCancelled) setStatus(isLoggedIn ? 'authenticated' : 'unauthenticated');
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const markLoggedIn = useCallback(() => setStatus('authenticated'), []);
  const markLoggedOut = useCallback(() => setStatus('unauthenticated'), []);

  const logout = useCallback(async () => {
    await logoutUseCase();
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({ status, markLoggedIn, markLoggedOut, logout }), [status, markLoggedIn, markLoggedOut, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
