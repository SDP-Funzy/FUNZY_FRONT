'use client';

import { useContext } from 'react';

import { AuthContext } from '@/components/auth/AuthProvider';

/** 로그인 상태와 로그인·로그아웃 처리. AuthProvider 안에서만 쓸 수 있다 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return context;
};
