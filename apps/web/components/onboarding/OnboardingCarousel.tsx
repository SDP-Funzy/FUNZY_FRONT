'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { useSnapCarousel } from '@/hooks/common/useSnapCarousel';
import { cn } from '@/lib/cn';

const ONBOARDING_SLIDES = [
  '소비하는 선물에서,\n건네는 마음으로',
  '상대를 떠올리며 고른 취향 하나와\n이유를 카드에 적어요',
  '떠오른 선물 세 가지를\n직접 그려서 보내면,\n상대가 그중 하나를 골라요',
  '마음에 든 카드를 콕하면\n카테고리별로 쌓여요',
] as const;

const LAST_INDEX = ONBOARDING_SLIDES.length - 1;

/**
 * 온보딩 슬라이드 (Figma 온보딩 4장)
 * - 스와이프 / 아래 점 클릭 / 좌우 방향키로 이동
 * - 버튼은 마지막 장에만 보이고, 나머지 장에서도 자리를 비워둬서 점 위치가 고정된다
 */
export const OnboardingCarousel = () => {
  const router = useRouter();
  const { containerRef, activeIndex, handleScroll, scrollToIndex } = useSnapCarousel();
  const isLastSlide = activeIndex === LAST_INDEX;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(Math.min(activeIndex + 1, LAST_INDEX));
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(Math.max(activeIndex - 1, 0));
    }
  };

  return (
    <section aria-roledescription="carousel" aria-label="펀지 소개" className="flex flex-1 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ONBOARDING_SLIDES.map((text, index) => (
          <div
            key={text}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${ONBOARDING_SLIDES.length}`}
            aria-hidden={index !== activeIndex}
            className="flex w-full shrink-0 snap-center snap-always items-center px-[28px]"
          >
            <p className="text-24 leading-[30px] font-bold whitespace-pre-line text-black">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center px-page pb-[calc(35px+env(safe-area-inset-bottom,0px))]">
        {/* 점 7px, 간격 15px → 22px 버튼 가운데에 점을 두면 간격이 그대로 맞고 누르기도 쉽다 */}
        <div className="flex items-center">
          {ONBOARDING_SLIDES.map((text, index) => (
            <button
              key={text}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`${index + 1}번째 소개로 이동`}
              aria-current={index === activeIndex ? 'step' : undefined}
              className="flex size-[22px] items-center justify-center"
            >
              <span className={cn('size-[7px] rounded-full', index === activeIndex ? 'bg-orange' : 'bg-gray-m-800')} />
            </button>
          ))}
        </div>

        {/* 피그마: 점 아래 40px 에 버튼. 점 버튼 안쪽 여백 7.5px 를 빼서 33px */}
        <div className="mt-[33px] h-[47px] w-full">
          {isLastSlide && <Button onClick={() => router.push('/signup')}>회원 가입하기</Button>}
        </div>
      </div>
    </section>
  );
};
