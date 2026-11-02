import type { ReactNode } from 'react';
import { LetterboxPreviewProvider } from '@/components/letterbox/LetterboxPreviewProvider';

export default function LetterboxLayout({ children }: { children: ReactNode }) {
  return <LetterboxPreviewProvider>{children}</LetterboxPreviewProvider>;
}
