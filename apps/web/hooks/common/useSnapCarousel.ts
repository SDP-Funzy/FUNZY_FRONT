'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent, UIEvent } from 'react';

/** 이만큼(슬라이드 폭 대비) 이상 끌어야 다음/이전 장으로 넘어간다 */
const SWIPE_THRESHOLD_RATIO = 0.15;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  startIndex: number;
};

/**
 * CSS scroll-snap 기반 가로 캐러셀 상태
 * - 터치 스와이프, 트랙패드는 브라우저 기본 스크롤이 처리
 * - PC 마우스는 기본으로 끌어서 넘길 수 없어서 드래그 스와이프를 직접 처리
 * - 현재 위치(activeIndex)는 스크롤 위치로 계산
 * - scrollToIndex 로 점 클릭, 키보드 이동 처리
 */
export const useSnapCarousel = (slideCount: number) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
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

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    // 터치·펜은 브라우저 기본 스와이프에 맡기고, 마우스 왼쪽 버튼만 직접 처리
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: container.scrollLeft,
      startIndex: Math.round(container.scrollLeft / container.clientWidth),
    };
    container.setPointerCapture(e.pointerId);
    // 끄는 동안 스냅이 켜져 있으면 손을 따라오지 않고 계속 원래 장으로 튕긴다
    container.style.scrollSnapType = 'none';
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container || drag.pointerId !== e.pointerId) return;

    container.scrollLeft = drag.startScrollLeft - (e.clientX - drag.startX);
  }, []);

  const handlePointerEnd = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container || drag.pointerId !== e.pointerId) return;

      dragRef.current = null;
      if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);

      // 끈 방향과 거리로 목표 장 결정 (짧게 끌면 제자리로 돌아감)
      const deltaX = e.clientX - drag.startX;
      const threshold = container.clientWidth * SWIPE_THRESHOLD_RATIO;
      let targetIndex = drag.startIndex;
      if (deltaX < -threshold) targetIndex += 1;
      if (deltaX > threshold) targetIndex -= 1;
      targetIndex = Math.max(0, Math.min(slideCount - 1, targetIndex));

      // 목표 위치까지 이동이 끝난 뒤에 스냅을 다시 켠다 (중간에 켜면 엉뚱한 장으로 튈 수 있음)
      const restoreSnap = () => {
        container.style.scrollSnapType = '';
      };
      const targetLeft = targetIndex * container.clientWidth;

      if (Math.abs(container.scrollLeft - targetLeft) < 1) {
        restoreSnap();
        return;
      }
      if ('onscrollend' in window) {
        container.addEventListener('scrollend', restoreSnap, { once: true });
      } else {
        setTimeout(restoreSnap, 500);
      }
      scrollToIndex(targetIndex);
    },
    [scrollToIndex, slideCount],
  );

  return {
    containerRef,
    activeIndex,
    scrollToIndex,
    containerHandlers: {
      onScroll: handleScroll,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
};