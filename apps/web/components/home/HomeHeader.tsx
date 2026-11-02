'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';
import { useNotifications } from '@/hooks/notifications/useNotifications';

/**
 * 홈 헤더 (Figma 홈화면)
 * - 왼쪽: Funzy 로고
 * - 오른쪽: 프로필(→ 환경설정), 알림(→ 각종 알림). 피그마 주석 기준
 * 버튼 아이콘은 주황 원까지 포함해 SVG 로 내보낸 파일을 쓴다. (42px)
 */
export const HomeHeader = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <Header
      className="bg-cream"
      paddingClassName="pr-[24px] pl-[15px]"
      left={
        <Link href={ROUTES.home} aria-label="홈">
          <Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority />
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
            <Image src="/icons/header-profile.svg" alt="" width={42} height={42} />
          </button>
          <button
            type="button"
            aria-label={unreadCount ? `알림, 읽지 않은 알림 ${unreadCount}개` : '알림'}
            onClick={() => router.push(ROUTES.notifications)}
            className="relative flex size-[42px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <Image src="/icons/header-notification.svg" alt="" width={42} height={42} />
            {(unreadCount ?? 0) > 0 && <span aria-hidden="true" className="absolute top-0 right-0 size-[9px] rounded-full border-2 border-cream bg-error" />}
          </button>
        </>
      }
    />
  );
};
