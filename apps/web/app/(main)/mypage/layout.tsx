import type { ReactNode } from 'react';

import { MypagePreviewProvider } from '@/components/mypage/MypagePreviewProvider';

export default function MypageLayout({ children }: { children: ReactNode }) {
  return <MypagePreviewProvider>{children}</MypagePreviewProvider>;
}
