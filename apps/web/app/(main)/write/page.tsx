import type { Metadata } from 'next';

import { WriteScreen } from '@/components/write/WriteScreen';

export const metadata: Metadata = {
  title: '마음카드 쓰기 | Funzy',
};

const WritePage = () => {
  return <WriteScreen />;
};

export default WritePage;
