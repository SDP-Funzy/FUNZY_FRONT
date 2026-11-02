'use client';

import { useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, PointerEvent } from 'react';

export const useCardCarousel = (count: number, initialIndex = 0, stepInset = 48) => {
  const initial = Math.max(0, Math.min(Math.max(0, count - 1), initialIndex));
  const [active, setActive] = useState(initial);
  const activeRef = useRef(initial);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; scrollLeft: number; index: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(() => node.scrollTo({ left: activeRef.current * (node.clientWidth - stepInset), behavior: 'instant' }));
    observer.observe(node);
    return () => observer.disconnect();
  }, [count, stepInset]);
  const move = (index: number) => {
    const node = track.current;
    if (!node) return;
    node.scrollTo({ left: Math.max(0, Math.min(count - 1, index)) * (node.clientWidth - stepInset), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const node = event.currentTarget;
    drag.current = null; node.style.scrollSnapType = '';
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    if (!current.moved) return;
    suppressClick.current = true;
    const distance = event.clientX - current.x;
    move(cancelled ? Math.round(node.scrollLeft / (node.clientWidth - stepInset)) : current.index + (Math.abs(distance) > 40 ? distance < 0 ? 1 : -1 : 0));
  };
  const handlers: HTMLAttributes<HTMLDivElement> = {
    onPointerDownCapture: event => {
      if (event.button !== 0) return;
      suppressClick.current = false;
      if (event.pointerType !== 'mouse') return;
      drag.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft, index: activeRef.current, moved: false };
    },
    onPointerMoveCapture: event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (!(event.buttons & 1)) { drag.current = null; return; }
      const distance = event.clientX - current.x;
      if (!current.moved && Math.abs(distance) < 6) return;
      current.moved = true;
      const node = event.currentTarget; node.style.scrollSnapType = 'none';
      if (!node.hasPointerCapture(event.pointerId)) node.setPointerCapture(event.pointerId);
      event.preventDefault(); node.scrollLeft = current.scrollLeft - distance;
    },
    onPointerUpCapture: event => finishDrag(event),
    onPointerCancelCapture: event => finishDrag(event, true),
    onLostPointerCapture: event => finishDrag(event, true),
    onClickCapture: event => { if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } },
    onDragStart: event => event.preventDefault(),
    onScroll: event => {
      const node = event.currentTarget;
      const index = Math.max(0, Math.min(count - 1, Math.round(node.scrollLeft / (node.clientWidth - stepInset))));
      activeRef.current = index; setActive(index);
    },
    onKeyDown: event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.currentTarget.focus(); move(active + (event.key === 'ArrowLeft' ? -1 : 1)); } },
  };
  return { active, track, handlers };
};
