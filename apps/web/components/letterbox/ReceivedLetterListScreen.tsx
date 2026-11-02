'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LetterboxCalendar } from '@/components/letterbox/LetterboxCalendar';
import { LetterboxHeader } from '@/components/letterbox/LetterboxHeader';
import { useLetterboxApi } from '@/components/letterbox/LetterboxApiProvider';
import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';
import { cn } from '@/lib/cn';
import { koreaToday, parseDateKey } from '@/lib/letterboxPreview';
import { letterFailure, letterImageUrl } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

export const ReceivedLetterListScreen = () => {
  const { store, state, tab, setTab, query, setQuery, date, setDate } = useLetterboxApi();
  const [searchOpen, setSearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  const [debounced, setDebounced] = useState(query);
  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(timer); }, [query]);
  const key = JSON.stringify({ senderName: debounced.trim() || undefined, locked: tab === 'hidden', ...(date ? { receivedFrom: date, receivedTo: date } : {}) });
  useEffect(() => { void store.load(JSON.parse(key)); return store.cancel; }, [store, key]);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const today = koreaToday(); const displayedDate = parseDateKey(date ?? today);
  const items = state.key === key ? state.items : [];
  return <div className="flex flex-1 flex-col bg-gray-pc-50 pb-[32px]">
    <LetterboxHeader expanded={searchOpen} onSearch={() => setSearchOpen(open => !open)} />
    {searchOpen && <div id="letterbox-search" className="px-[24px] pt-[16px]"><label htmlFor="received-search" className="sr-only">보낸 사람 이름</label><input id="received-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="보낸 사람 이름 검색" className="min-h-[44px] w-full rounded-control border border-gray-m-100 bg-white px-[12px] text-14" /></div>}
    <div role="group" aria-label="편지 분류" className="flex flex-wrap gap-[9px] px-[24px] pt-[24px]">
      {([{ key: 'all', text: '전체' }, { key: 'favorites', text: '즐겨찾기' }, { key: 'hidden', text: '잠긴편지' }] as const).map(item => <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => item.key === 'favorites' ? setNotice(true) : setTab(item.key)} className={cn('min-h-[36px] rounded-full border border-black px-[14px] text-14 font-semibold', tab === item.key ? 'bg-black text-white' : 'text-black')}>{item.text}</button>)}
    </div>
    <div className="relative mx-[24px] mt-[14px]"><button type="button" aria-label="편지 날짜 선택" aria-expanded={calendarOpen} aria-controls="letterbox-calendar" onClick={() => setCalendarOpen(open => !open)} className="rounded-control p-[10px] text-left font-en"><span className="block text-15 font-bold">{displayedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span><span className="flex items-center gap-[12px] text-[28px] font-bold">{date && date !== today ? displayedDate.toLocaleDateString('en-US', { weekday: 'short' }) : 'Today'}<Image src="/icons/calendar.svg" alt="" width={30} height={27} className="brightness-0" /></span></button>
      {calendarOpen && <LetterboxCalendar today={today} selected={date} letters={[]} onClose={closeCalendar} onSelect={value => { setDate(value); setCalendarOpen(false); }} />}
    </div>
    <div className="flex items-center justify-between px-[30px] pt-[12px] text-12 text-gray-m-400"><p role="status">{date ?? '전체 날짜'} · {state.total}통</p><button type="button" onClick={() => { void store.reload(); }} className="min-h-[44px] px-[8px] underline">새로고침</button></div>
    {(state.loading || state.key !== key) && <p role="status" className="px-page py-[32px] text-center text-14 text-gray-m-400">편지를 불러오고 있어요.</p>}
    {!!state.error && state.key === key && <div className="px-page py-[20px] text-center"><p role="alert" className="text-14 text-error">{letterFailure(state.error)}</p><Button className="mt-[16px]" onClick={() => void store.reload()}>다시 시도</Button></div>}
    {state.key === key && !state.loading && state.loaded && !state.error && !items.length && <p className="px-page py-[60px] text-center text-14 text-gray-m-400">{query || date || tab === 'hidden' ? '조건에 맞는 편지가 없어요.' : '아직 받은 편지가 없어요.'}</p>}
    <div className="grid grid-cols-2 gap-x-[34px] gap-y-[44px] px-[36px] pt-[36px] pb-[24px]">{items.map(letter => <Link key={letter.letterId} href={`${ROUTES.letterbox}/${letter.letterId}`} aria-label={`${letter.senderName}의 편지 ${letter.heartCardCount}장 보기`} className="flex min-w-0 flex-col items-center rounded-control focus-visible:outline-2 focus-visible:outline-orange">
      <span className="relative mb-[12px] block aspect-[1.1] w-full max-w-[120px]">
        {letter.heartCardCount > 1 && <span className="absolute inset-[4px] -translate-y-[8px] rotate-8 rounded-[12px] bg-gray-m-50" />}
        <span className="absolute inset-[4px] overflow-hidden rounded-[12px] bg-gray-m-100 shadow-sm">{!letter.locked && letterImageUrl(letter.thumbnailImageUrls?.[0]) && <Image src={letterImageUrl(letter.thumbnailImageUrls[0])!} alt="" fill unoptimized sizes="120px" className="object-cover" />}</span>
        {!letter.read && <span className="absolute -top-[6px] right-0 size-[9px] rounded-full bg-orange" aria-label="읽지 않은 편지" />}
      </span><span className="w-full truncate text-center font-en text-16 font-bold text-gray-m-400">{letter.senderName || letter.sender?.nickname || '보낸 사람'}</span><span className="mt-[4px] text-12 text-gray-m-400">카드 {letter.heartCardCount}개{letter.locked ? ' · 잠긴편지' : ''}</span>
    </Link>)}</div>
    {!state.last && state.loaded && <div className="px-page"><Button disabled={state.loadingMore} onClick={() => void store.more()}>{state.loadingMore ? '불러오는 중...' : '더 보기'}</Button></div>}
    <Popup isOpen={notice} title="즐겨찾기 목록은 준비 중이에요" description="지금은 전체·잠긴편지 목록과 편지 열람을 사용할 수 있어요." showCancel={false} onCancel={() => setNotice(false)} onConfirm={() => setNotice(false)} />
  </div>;
};
