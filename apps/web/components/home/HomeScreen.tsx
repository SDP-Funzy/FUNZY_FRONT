'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { HomeHeader } from '@/components/home/HomeHeader';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';

/**
 * 홈 화면 (Figma 홈화면 - 편지쓰기)
 * 가운데 묶음은 헤더 아래가 아니라 화면 전체 기준 세로 중앙이라, 아래쪽에 헤더 높이(60px)만큼 여백을 줘서 맞춘다.
 */
export const HomeScreen = () => {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <HomeHeader />

      <section className="flex flex-1 flex-col items-center justify-center px-page pb-[60px]">
        <Image src="/images/envelope-home.png" alt="" width={119} height={86} priority />
        <p className="mt-[23px] text-center text-16 leading-[1.55] font-medium text-black">
          소중한 사람에게 내 진심을 담아
          <br />
          마음을 전해볼까요?
        </p>
        <Button
          variant="primary"
          fullWidth={false}
          onClick={() => router.push(ROUTES.write)}
          className="mt-[20px] w-[158px]"
        >
          편지쓰기
        </Button>
      </section>
    </div>
  );
};
