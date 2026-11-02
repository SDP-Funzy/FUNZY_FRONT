import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** 메일 링크는 기존 세션 유무와 관계없이 열려야 한다. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function RecoveryLayout({ children }: { children: ReactNode }) {
  return children;
}
