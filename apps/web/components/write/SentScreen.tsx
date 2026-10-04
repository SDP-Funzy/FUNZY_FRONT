'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { ROUTES } from '@/lib/routes';

/** 봉투가 닫히는 장면 (Figma 전송 완료 3장면) */
const ENVELOPE_FRAMES = ['/images/envelope-sent-1.svg', '/images/envelope-sent-2.svg', '/images/envelope-sent-3.svg'];
/** 장면이 바뀌는 간격과, 그중 서서히 겹치며 넘어가는 시간 */
const FRAME_INTERVAL_MS = 550;

/**
 * 전송 완료 화면 (Figma "마음을 보냈어요!", 주석: 모션)
 * 편지가 봉투에 들어가 닫히는 3장면을 차례로 보여준다. 움직임 줄이기 설정이면 마지막 장면만.
 */
export const SentScreen = () => {
  const router = useRouter();
  const { reset } = useWriteDraft();
  const [frameIndex, setFrameIndex] = useState(0);

  // 보낸 편지는 작성 내용에서 비운다. 뒤로 가기로 작성 화면에 돌아가도 같은 편지를 다시 보낼 수 없다
  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrameIndex(ENVELOPE_FRAMES.length - 1);
      return;
    }
    const timer = window.setInterval(() => {
      setFrameIndex((index) => {
        if (index >= ENVELOPE_FRAMES.length - 1) {
          window.clearInterval(timer);
          return index;
        }
        return index + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center bg-cream px-page">
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* 세 장면을 겹쳐 두고 투명도만 바꾼다. 투명도가 서서히 바뀌면서 이전 장면은 사라지고 다음 장면이 나타나
            장면 사이가 자연스럽게 이어진다 (이미지를 새로 불러오지 않아 깜빡임도 없음) */}
        <div className="relative h-[139px] w-[131px]" role="img" aria-label="편지가 봉투에 담겼어요">
          {ENVELOPE_FRAMES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              className={cn(
                'absolute inset-0 block size-full transition-opacity duration-300 ease-in-out motion-reduce:transition-none',
                index === frameIndex ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
        </div>
        <p className="mt-[31px] text-24 leading-[30px] font-semibold text-black">마음을 보냈어요!</p>
      </div>

      <div className="pb-[calc(94px+env(safe-area-inset-bottom,0px))]">
        <Button variant="accent" fullWidth={false} onClick={() => router.replace(ROUTES.home)} className="w-[170px]">
          확인했어요
        </Button>
      </div>
    </div>
  );
};