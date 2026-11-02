import type { ReactNode } from 'react';
import { ArchiveApiProvider } from '@/components/archive/ArchiveApiProvider';

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return <ArchiveApiProvider>{children}</ArchiveApiProvider>;
}
