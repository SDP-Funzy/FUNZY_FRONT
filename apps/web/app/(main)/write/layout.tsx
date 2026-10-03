import type { ReactNode } from 'react';

import { WriteDraftProvider } from '@/components/write/WriteDraftProvider';

/** 편지 쓰기 화면 묶음. 마음카드 ↔ 선물카드를 오가도 작성 내용이 유지된다 */
const WriteLayout = ({ children }: { children: ReactNode }) => {
  return <WriteDraftProvider>{children}</WriteDraftProvider>;
};

export default WriteLayout;
