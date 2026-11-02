'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { LetterboxCalendar } from '@/components/letterbox/LetterboxCalendar';
import { LetterboxHeader } from '@/components/letterbox/LetterboxHeader';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { Popup } from '@/components/ui/Popup';
import { cn } from '@/lib/cn';
import { filterLetters, koreaToday, parseDateKey } from '@/lib/letterboxPreview';
import type { LetterboxTab } from '@/lib/letterboxPreview';
import { ROUTES } from '@/lib/routes';

export const LetterboxScreen = ({ senderId }: { senderId?: string }) => {
  const { letters, tab, setTab, query, setQuery, date, setDate, toggleFavorite, unhide } = useLetterboxPreview();
  const [searchOpen, setSearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const today = koreaToday();
  const displayedDate = parseDateKey(date ?? today);
  const available = filterLetters(letters, tab, query, null);
  const visible = filterLetters(letters, tab, query, date);
  const sender = letters.find(letter => letter.senderId === senderId)?.sender;
  const cards = visible.filter(letter => letter.senderId === senderId);
  const groups = [...new Set(visible.map(letter => letter.senderId))].map(id => ({ id, sender: visible.find(letter => letter.senderId === id)!.sender, count: visible.filter(letter => letter.senderId === id).length }));
  const reset = () => { setTab('all'); setQuery(''); setDate(null); };

  return <div className="flex flex-1 flex-col bg-gray-pc-50 pb-[32px]">
    <LetterboxHeader sender={!!senderId} expanded={searchOpen} onSearch={() => { setSearchOpen(open => !open); if (!searchOpen) requestAnimationFrame(() => search.current?.focus()); }} />
    <div id="letterbox-search" hidden={!searchOpen} className="px-[24px] pt-[16px]">
      <label htmlFor="sender-search" className="sr-only">보낸 사람 이름</label>
      <div className="flex gap-[8px]">
        <input id="sender-search" ref={search} type="search" maxLength={50} value={query} onChange={event => setQuery(event.target.value)} placeholder="보낸 사람 이름 검색"
          onKeyDown={event => { if (event.key === 'Escape') { setSearchOpen(false); } }} className="min-h-[44px] min-w-0 flex-1 rounded-control border border-gray-m-200 bg-white px-[12px] text-14 focus:outline-2 focus:outline-orange" />
        <button type="button" onClick={() => { setQuery(''); setSearchOpen(false); }} className="min-h-[44px] px-[8px] text-14">닫기</button>
      </div>
    </div>
    {!senderId && <>
      <div role="group" aria-label="편지 분류" className="flex flex-wrap gap-[9px] px-[24px] pt-[24px]">
        {([{ value: 'all', label: '전체' }, { value: 'favorites', label: '즐겨찾기' }, { value: 'hidden', label: '잠긴편지' }] as { value: LetterboxTab; label: string }[]).map(item =>
          <button key={item.value} type="button" aria-pressed={tab === item.value} onClick={() => setTab(item.value)} className={cn('min-h-[36px] rounded-full border border-black px-[14px] text-14 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange', tab === item.value ? 'bg-black text-white' : 'text-black')}>{item.label}</button>)}
      </div>
      <div className="relative mx-[24px] mt-[14px]">
        <button type="button" aria-label="편지 날짜 선택" aria-expanded={calendarOpen} aria-controls="letterbox-calendar" onClick={() => setCalendarOpen(open => !open)}
          className={cn('rounded-control p-[10px] text-left font-en focus-visible:outline-2 focus-visible:outline-orange', calendarOpen && 'bg-gray-m-500 text-white')}>
          <span className="block text-15 font-bold">{displayedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="flex items-center gap-[12px] text-[28px] font-bold">{date === null || date === today ? 'Today' : displayedDate.toLocaleDateString('en-US', { weekday: 'short' })}
            <Image src="/icons/calendar.svg" alt="" width={30} height={27} className={calendarOpen ? '' : 'brightness-0'} />
          </span>
        </button>
        {calendarOpen && <LetterboxCalendar today={today} selected={date} letters={available} onClose={closeCalendar} onSelect={value => { setDate(value); setCalendarOpen(false); }} />}
      </div>
    </>}
    <div className="flex items-center justify-between gap-[8px] px-[30px] pt-[12px] text-12 text-gray-m-400">
      <p role="status">{senderId ? `${sender ?? '알 수 없는 보낸 사람'}의 편지 ${cards.length}장` : `${date ? `${date} · ` : '전체 날짜 · '}${visible.length}장`}{tab === 'hidden' ? ' · 숨긴 편지' : ''}</p>
      {(query || date || tab !== 'all') && <button type="button" onClick={reset} className="min-h-[44px] shrink-0 underline underline-offset-2">필터 초기화</button>}
    </div>
    {!senderId ? <div className="grid grid-cols-2 gap-x-[34px] gap-y-[48px] px-[36px] pt-[44px] pb-[24px]">
      {groups.map(group => <Link key={group.id} href={`${ROUTES.letterbox}/${group.id}`} aria-label={`${group.sender}의 편지 ${group.count}장 보기`} className="group flex min-w-0 flex-col items-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-orange">
        <span aria-hidden="true" className="relative mb-[12px] block aspect-[1.1] w-full max-w-[120px]">
          {group.count > 2 && <span className="absolute inset-[4px] -translate-x-[6px] -translate-y-[18px] -rotate-9 rounded-[12px] bg-gray-pc-200" />}
          {group.count > 1 && <span className="absolute inset-[4px] translate-x-[10px] -translate-y-[10px] rotate-8 rounded-[12px] bg-gray-m-50" />}
          <span className="absolute inset-[4px] rounded-[12px] bg-gray-m-100 shadow-sm transition-transform group-hover:-translate-y-[3px] motion-reduce:transition-none" />
        </span>
        <span className="w-full truncate text-center font-en text-16 font-bold text-gray-m-400">{group.sender}</span>
      </Link>)}
    </div> : <div className="grid grid-cols-2 gap-x-[28px] gap-y-[28px] px-[24px] pt-[24px]">
      {cards.map(card => <div key={card.id} className="relative min-w-0">
        {card.hidden ? <button type="button" onClick={() => setRestoreId(card.id)} aria-label={`${card.sender}의 ${card.date} 숨긴 편지, 숨김 해제`}
          className="relative block aspect-[1.1] w-full overflow-hidden rounded-[12px] bg-gray-m-100 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange">
          <span className="text-14 font-medium text-gray-m-600">숨긴 편지<br /><span className="text-12">눌러서 숨김 해제</span></span>
        </button> : <Link href={`${ROUTES.letterbox}/${card.senderId}/${card.id}`} aria-label={`${card.sender}의 ${card.date} 편지 보기`}
          className="relative block aspect-[1.1] w-full overflow-hidden rounded-[12px] bg-gray-m-100 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange">
          <Image src={card.image} alt="" fill sizes="(min-width: 768px) 163px, 42vw" className="object-cover" />
        </Link>}
        {!card.hidden && <button type="button" aria-label={`${card.date} 편지 ${card.id} 즐겨찾기`} aria-pressed={card.favorite} onClick={() => toggleFavorite(card.id)} className="absolute right-0 bottom-0 flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
          <Image src={card.favorite ? '/icons/favorite-active.svg' : '/icons/favorite-inactive.svg'} alt="" width={24} height={24} />
        </button>}
      </div>)}
    </div>}
    {(senderId ? cards.length === 0 : groups.length === 0) && <div className="px-page py-[60px] text-center text-14 text-gray-m-400">
      <p>{senderId && !sender ? '보낸 사람을 찾을 수 없어요.' : '조건에 맞는 편지가 없어요.'}</p>
      <button type="button" onClick={reset} className="mt-[16px] min-h-[44px] rounded-control border border-gray-m-200 px-[16px] text-black">필터 초기화</button>
    </div>}
    <Popup isOpen={restoreId !== null} title="편지 숨김을 해제할까요?" description="전체 목록에 다시 표시됩니다." confirmLabel="숨김 해제" onCancel={() => setRestoreId(null)} onConfirm={() => { if (restoreId) unhide(restoreId); setRestoreId(null); }} />
  </div>;
};
