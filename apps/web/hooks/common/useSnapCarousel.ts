'use client';

import { useCallback, useRef, useState } from 'react';
import type { UIEvent } from 'react';

/**
 * CSS scroll-snap 기반 가로 캐러셀 상태
 * - 터치 스와이프, 트랙패드는 브라우저 기본 스크롤이 처리
 * - 현재 위치(activeIndex)는 스크롤 위치로 계산
 * - scrollToIndex 로 점 클릭, 키보드 이동 처리
 */
export const useSnapCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth === 0) return;
    setActiveIndex(Math.round(scrollLeft / clientWidth));
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  return { containerRef, activeIndex, handleScroll, scrollToIndex };
};
