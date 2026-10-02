'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';

/**
 * 홈 헤더 (Figma 홈화면)
 * - 왼쪽: Funzy 로고
 * - 오른쪽: 프로필(→ 환경설정), 알림(→ 각종 알림). 피그마 주석 기준
 * 버튼 아이콘은 주황 원까지 포함해 SVG 로 내보낸 파일을 쓴다. (42px)
 */
export const HomeHeader = () => {
  const router = useRouter();

  return (
    <Header
      className="bg-cream"
      paddingClassName="pr-[24px] pl-[15px]"
      left={
        <Link href={ROUTES.home} aria-label="홈">
          <Image src="/images/logo-funzy-small.png" alt="Funzy" width={83} height={56} priority />
        </Link>
      }
      right={
        <>
          <button
            type="button"
            aria-label="환경설정"
            onClick={() => router.push(ROUTES.mypage)}
            className="flex size-[42px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <img src="/icons/header-profile.svg" alt="" className="block size-[42px]" />
          </button>
          <button
            type="button"
            aria-label="알림"
            onClick={() => router.push(ROUTES.notifications)}
            className="flex size-[42px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <img src="/icons/header-notification.svg" alt="" className="block size-[42px]" />
          </button>
        </>
      }
    />
  );
};
