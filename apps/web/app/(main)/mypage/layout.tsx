import type { ReactNode } from 'react';

import { MypagePreviewProvider } from '@/components/mypage/MypagePreviewProvider';
import { MypageApiProvider } from '@/components/mypage/MypageApiProvider';

export default function MypageLayout({ children }: { children: ReactNode }) {
  return <MypageApiProvider><MypagePreviewProvider>{children}</MypagePreviewProvider></MypageApiProvider>;
}
