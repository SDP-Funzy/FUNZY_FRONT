import type { Metadata } from 'next';

import { SentScreen } from '@/components/write/SentScreen';

export const metadata: Metadata = {
  title: '마음을 보냈어요 | Funzy',
};

const WriteSentPage = () => {
  return <SentScreen />;
};

export default WriteSentPage;
