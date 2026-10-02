import type { ReactNode } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';

/** 로그인하지 않은 사람만 보는 화면 묶음 (온보딩, 로그인, 회원가입). 주소에는 (guest) 가 붙지 않는다 */
const GuestLayout = ({ children }: { children: ReactNode }) => {
  return <AuthGuard allow="guest">{children}</AuthGuard>;
};

export default GuestLayout;
