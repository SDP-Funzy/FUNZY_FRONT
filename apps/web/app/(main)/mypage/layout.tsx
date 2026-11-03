import type { ReactNode } from 'react';

import { MypageApiProvider } from '@/components/mypage/MypageApiProvider';

export default function MypageLayout({ children }: { children: ReactNode }) {
  return <MypageApiProvider>{children}</MypageApiProvider>;
}
