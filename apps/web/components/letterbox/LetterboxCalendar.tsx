'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReceivedCalendar } from '@sdp/core';
import type { PreviewLetter } from '@/lib/letterboxPreview';
import { dateKey, parseDateKey } from '@/lib/letterboxPreview';
import { cn } from '@/lib/cn';
import { useApiResource } from '@/hooks/common/useApiResource';
import { letterFailure, letterImageUrl } from '@/lib/letterService';

export const LetterboxCalendar = ({ today, selected, letters, loadMonth, onSelect, onClose }: {
  today: string; selected: string | null; letters?: PreviewLetter[];
  loadMonth?: (year: number, month: number, signal: AbortSignal) => Promise<ReceivedCalendar>;
  onSelect: (date: string | null) => void; onClose: () => void;
}) => {
  const [month, setMonth] = useState(() => { const initial = parseDateKey(selected ?? today); initial.setDate(1); return initial; });
  const year = month.getFullYear(); const monthNumber = month.getMonth() + 1;
  const load = useCallback((signal: AbortSignal) => loadMonth ? loadMonth(year, monthNumber, signal) : Promise.resolve({ type: 'RECEIVED' as const, year, month: monthNumber, days: [] }), [loadMonth, year, monthNumber]);
  const resource = useApiResource(`received-calendar:${year}-${monthNumber}`, load, !!loadMonth);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const end = new Date(month); end.setMonth(end.getMonth() + 1); end.setDate(0);
  const moveMonth = (offset: number) => setMonth(current => { const next = new Date(current); next.setMonth(next.getMonth() + offset); return next; });
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
      <button type="button" disabled={year === 1 && monthNumber === 1} className="min-h-[44px] px-[8px] disabled:opacity-40" onClick={() => moveMonth(-1)}>이전 달</button>
      <button type="button" disabled={year === 9999 && monthNumber === 12} className="min-h-[44px] px-[8px] disabled:opacity-40" onClick={() => moveMonth(1)}>다음 달</button>
    </div>
    {loadMonth && <p className="mb-[12px] text-12 leading-[1.5] text-gray-m-400">달력은 받은 카드 전체 기준이에요.</p>}
    {loadMonth && resource.loading && <p role="status" className="mb-[12px] text-12 text-gray-m-500">달력 사진을 불러오고 있어요.</p>}
    {loadMonth && !!resource.error && <div className="mb-[12px] text-12"><p role="alert" className="text-error">{letterFailure(resource.error)}</p><button type="button" onClick={() => { setFailedImages(new Set()); void resource.reload(); }} className="min-h-[44px] underline">달력 다시 불러오기</button></div>}
    {loadMonth && resource.data && !resource.loading && !resource.error && !resource.data.days.length && <p role="status" className="mb-[12px] text-12 text-gray-m-500">이번 달에는 받은 카드가 없어요.</p>}
    <div aria-busy={!!loadMonth && resource.loading} className="grid grid-cols-7 gap-y-[6px] font-en text-14">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <span key={day} className="pb-[12px] text-center text-12 text-gray-m-300">{day}</span>)}
      {Array.from({ length: month.getDay() }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: end.getDate() }, (_, index) => {
        const day = new Date(month); day.setDate(index + 1); const key = dateKey(day);
        const preview = letters?.find(letter => letter.date === key);
        const received = !resource.error ? resource.data?.days.find(item => item.date === key) : undefined;
        const hasCards = loadMonth ? !!received : !!preview;
        const cover = (loadMonth ? received?.imageUrls ?? [] : preview ? [preview.image] : []).map(letterImageUrl).find((url): url is string => !!url && !failedImages.has(url));
        return <button key={key} type="button" aria-label={`${key}${hasCards ? ', 편지 있음' : ''}`} aria-pressed={selected === key}
          onClick={() => onSelect(key)} className={cn('relative mx-auto flex aspect-square w-full max-w-[44px] items-center justify-center overflow-hidden rounded-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-orange', selected === key ? 'ring-2 ring-orange ring-inset' : key === today ? 'bg-gray-m-50' : '')}>
          {cover && <Image src={cover} alt="" fill unoptimized sizes="44px" onError={() => setFailedImages(current => new Set([...current, cover]))} className="object-cover brightness-60" />}
          <span className={cn('relative', cover && 'text-white')}>{index + 1}</span>
          {hasCards && !cover && <span aria-hidden="true" className="absolute bottom-[2px] size-[4px] rounded-full bg-orange" />}
        </button>;
      })}
    </div>
    <button type="button" onClick={() => onSelect(null)} className="mt-[18px] min-h-[44px] w-full rounded-control bg-black text-14 text-white">전체 날짜 보기</button>
  </div>;
};
