import type { ReactNode } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';

/** 로그인해야 볼 수 있는 화면 묶음 (홈, 보관함, 마이페이지 등). 주소에는 (main) 이 붙지 않는다 */
const MainLayout = ({ children }: { children: ReactNode }) => {
  return <AuthGuard allow="member">{children}</AuthGuard>;
};

export default MainLayout;
