'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

import { normalizeGiftPoint } from '@/lib/giftDraft';
import type { GiftCardDraft, GiftStroke, GiftTool } from '@/lib/giftDraft';
import { giftCanvasHasInk, renderGiftStrokes } from '@/lib/giftDrawing';

type Props = {
  card: GiftCardDraft;
  photoUrl?: string;
  tool?: GiftTool;
  onStroke?: (stroke: GiftStroke) => void;
  label?: string;
};

/** 좌표는 0~1로 보관해서 썸네일·미리보기·화면 크기가 달라도 같은 그림을 그린다. */
export const GiftArtwork = ({ card, photoUrl, tool = 'pen', onStroke, label = '선물 그림' }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<{ pointerId: number; stroke: GiftStroke } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const repaint = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(1, Math.round(rect.width * Math.min(window.devicePixelRatio || 1, 2)));
      if (canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; }
      renderGiftStrokes(canvas, active.current ? [...card.strokes, active.current.stroke] : card.strokes);
    };
    repaint();
    const observer = new ResizeObserver(repaint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [card.strokes]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return normalizeGiftPoint(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
  };
  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!onStroke || active.current || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = { pointerId: event.pointerId, stroke: { tool, width: tool === 'pen' ? 0.008 : 0.075, points: [getPoint(event)], hasInk: false } };
    renderGiftStrokes(event.currentTarget, [...card.strokes, active.current.stroke]);
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId !== event.pointerId) return;
    active.current.stroke.points.push(getPoint(event));
    renderGiftStrokes(event.currentTarget, [...card.strokes, active.current.stroke]);
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = active.current;
    if (!current || current.pointerId !== event.pointerId) return;
    active.current = null;
    if (event.type === 'pointerup') {
      const last = current.stroke.points.at(-1);
      const point = getPoint(event);
      if (last?.x !== point.x || last?.y !== point.y) current.stroke.points.push(point);
      renderGiftStrokes(event.currentTarget, [...card.strokes, current.stroke]);
    }
    const stroke = { ...current.stroke, hasInk: giftCanvasHasInk(event.currentTarget) };
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onStroke?.(stroke);
  };

  return (
    <div className="relative aspect-square w-full overflow-hidden">
      {photoUrl && <Image src={photoUrl} alt="" fill unoptimized sizes="362px" className="object-cover" />}
      <canvas ref={canvasRef} role="img" aria-label={label}
        className={`relative block aspect-square w-full ${onStroke ? 'touch-none cursor-crosshair' : 'pointer-events-none'}`}
        onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
        선물 그림입니다. 사진 추가 기능으로도 선물카드를 만들 수 있어요.
      </canvas>
    </div>
  );
};
