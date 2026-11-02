import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';

/** 디자인 확인 전 기존 인증 화면 컴포넌트와 토큰을 재사용한다. */
export const RecoveryFrame = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-1 flex-col bg-white">
    <Header
      title={title}
      left={
        <Link href={ROUTES.login} aria-label="로그인으로 돌아가기" className="p-[8px]">
          <Image src="/icons/arrow-back.svg" alt="" width={24} height={24} />
        </Link>
      }
    />
    <section className="mx-auto flex w-full max-w-[368px] flex-col gap-[24px] px-page py-[40px]">
      {children}
    </section>
  </div>
);
