import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';

export const MypageShell = ({ title, home = false, children }: { title: string; home?: boolean; children: ReactNode }) => (
  <div className="flex flex-1 flex-col bg-cream">
    <Header title={title} className="bg-cream" paddingClassName="px-[20px]"
      left={<Link href={home ? ROUTES.home : ROUTES.mypage} aria-label={home ? '홈으로 돌아가기' : '프로필로 돌아가기'}
        className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
        <Image src="/icons/chevron-left.svg" alt="" width={14} height={21} />
      </Link>} />
    {children}
  </div>
);
