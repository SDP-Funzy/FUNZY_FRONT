import type { Metadata } from 'next';

import { PreviewScreen } from '@/components/write/PreviewScreen';

export const metadata: Metadata = {
  title: '편지 미리보기 | Funzy',
};

const WritePreviewPage = () => {
  return <PreviewScreen />;
};

export default WritePreviewPage;
