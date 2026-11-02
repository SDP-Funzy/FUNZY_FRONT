import type { ReactNode } from 'react';
import { ArchivePreviewProvider } from '@/components/archive/ArchivePreviewProvider';
import { LetterboxPreviewProvider } from '@/components/letterbox/LetterboxPreviewProvider';

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return <LetterboxPreviewProvider><ArchivePreviewProvider>{children}</ArchivePreviewProvider></LetterboxPreviewProvider>;
}
