'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { PreviewLetter } from '@/lib/letterboxPreview';
import { dateKey, parseDateKey } from '@/lib/letterboxPreview';
import { cn } from '@/lib/cn';

export const LetterboxCalendar = ({ today, selected, letters, onSelect, onClose }: {
  today: string; selected: string | null; letters: PreviewLetter[]; onSelect: (date: string | null) => void; onClose: () => void;
}) => {
  const [month, setMonth] = useState(() => { const initial = parseDateKey(selected ?? today); return new Date(initial.getFullYear(), initial.getMonth(), 1, 12); });
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[aria-controls="letterbox-calendar"]')) return;
      if (event.target instanceof Node && !panel.current?.contains(event.target)) onClose();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); previous?.focus(); };
  }, [onClose]);
  return <div ref={panel} id="letterbox-calendar" role="dialog" aria-label="편지 날짜 선택" className="absolute inset-x-0 top-full z-20 mt-[16px] max-h-[min(520px,65dvh)] overflow-y-auto rounded-[18px] border border-gray-pc-200 bg-white/95 p-[16px] shadow-lg backdrop-blur-xl">
    <div className="flex items-center justify-between">
      <h2 className="font-en text-18 font-semibold">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
      <button ref={close} type="button" onClick={onClose} aria-label="달력 닫기" className="flex size-[44px] items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange">
        <Image src="/icons/close.svg" alt="" width={24} height={24} />
      </button>
    </div>
    <div className="mb-[8px] flex justify-between text-12">
      <button type="button" className="min-h-[44px] px-[8px]" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}>이전 달</button>
      <button type="button" className="min-h-[44px] px-[8px]" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}>다음 달</button>
    </div>
    <div className="grid grid-cols-7 gap-y-[6px] font-en text-14">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <span key={day} className="pb-[12px] text-center text-12 text-gray-m-300">{day}</span>)}
      {Array.from({ length: month.getDay() }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => {
        const key = dateKey(new Date(month.getFullYear(), month.getMonth(), index + 1, 12));
        const cover = letters.find(letter => letter.date === key);
        return <button key={key} type="button" aria-label={`${key}${cover ? ', 편지 있음' : ''}`} aria-pressed={selected === key}
          onClick={() => onSelect(key)} className={cn('relative mx-auto flex aspect-square w-full max-w-[44px] items-center justify-center overflow-hidden rounded-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-orange', selected === key ? 'ring-2 ring-orange ring-inset' : key === today ? 'bg-gray-m-50' : '')}>
          {cover && <Image src={cover.image} alt="" fill sizes="44px" className="object-cover brightness-60" />}
          <span className={cn('relative', cover && 'text-white')}>{index + 1}</span>
        </button>;
      })}
    </div>
    <button type="button" onClick={() => onSelect(null)} className="mt-[18px] min-h-[44px] w-full rounded-control bg-black text-14 text-white">전체 날짜 보기</button>
  </div>;
};
