import type { ReactNode } from 'react';
import { LetterboxApiProvider } from '@/components/letterbox/LetterboxApiProvider';

export default function LetterboxLayout({ children }: { children: ReactNode }) {
  return <LetterboxApiProvider>{children}</LetterboxApiProvider>;
}
