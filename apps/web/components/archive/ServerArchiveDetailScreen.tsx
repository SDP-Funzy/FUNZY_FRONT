'use client';
import type { ArchiveCardDetail } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { ArchiveCommentsSheet } from '@/components/archive/ArchiveCommentsSheet';
import { ArchiveApiState } from '@/components/archive/ArchiveApiState';
import { useArchiveApi } from '@/components/archive/ArchiveApiProvider';
import { Popup } from '@/components/ui/Popup';
import { useApiResource } from '@/hooks/common/useApiResource';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { archiveRepository } from '@/lib/archiveService';
import { letterFailure, letterImageUrl, letterRepository, letterRouteId } from '@/lib/letterService';

const CardBody = ({ card, owned, openComments }: { card: ArchiveCardDetail; owned: boolean; openComments: () => void }) => {
  const archive = useArchiveApi(); const router = useRouter();
  const [remove, setRemove] = useState(false); const [pending, setPending] = useState(false); const busy = useRef(false);
  const [error, setError] = useState<string | null>(null);
  return <>
    <div className="mb-[24px] flex shrink-0 items-center justify-between gap-[8px]"><p className="text-14 font-semibold">To: {card.receiverName}</p>{owned && <button type="button" disabled={pending} aria-label="아카이브에서 카드 삭제" onClick={() => setRemove(true)} className="flex size-[36px] items-center justify-center"><Image src="/icons/favorite-active.svg" alt="" width={24} height={24} /></button>}</div>
    <button type="button" aria-label="카드 댓글 열기" onClick={openComments} className="min-h-0 flex-1 overflow-y-auto overscroll-contain text-left text-14 leading-[1.8] break-words whitespace-pre-wrap select-text focus-visible:outline-2 focus-visible:outline-orange">{card.message}</button>
    <div className="mt-[20px] shrink-0 text-right text-14"><p className="font-semibold">From: {card.senderName}</p><p className="mt-[6px] text-12">{card.letterDate?.replaceAll('-', '.')}</p></div>
    <Popup isOpen={remove} title="아카이브에서 삭제하시겠습니까?" description="즐겨찾기가 해제됩니다. 원본 편지는 편지 보관함에 남아요." onCancel={() => { if (!busy.current) setRemove(false); }} onConfirm={async () => {
      if (busy.current) return; busy.current = true; setPending(true);
      try { await letterRepository.setKok(card.letterCardId, false); archive.reload(); router.replace(`/archive/${card.category}`); }
      catch (cause) { setRemove(false); setError(letterFailure(cause)); }
      finally { busy.current = false; setPending(false); }
    }} />
    <Popup isOpen={error !== null} title="삭제하지 못했어요" description={error ?? undefined} showCancel={false} onCancel={() => setError(null)} onConfirm={() => setError(null)} />
  </>;
};
const DetailSlide = ({ id, enabled, owned, openComments }: { id: number; enabled: boolean; owned: boolean; openComments: () => void }) => {
  const loader = useCallback(() => archiveRepository.detail(id), [id]);
  const resource = useApiResource(`archive-card:${id}`, loader, enabled);
  return !resource.error && resource.data ? <CardBody card={resource.data} owned={owned} openComments={openComments} /> : <ArchiveApiState error={resource.error} retry={resource.reload} />;
};
export const ServerArchiveDetailScreen = ({ id, commentsInitiallyOpen = false }: { id: string; commentsInitiallyOpen?: boolean }) => {
  const archive = useArchiveApi();
  const loader = useCallback(() => archiveRepository.detail(letterRouteId(id)), [id]);
  const numericId = /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0 ? Number(id) : null;
  const section = archive.data?.sections.find(group => group.cards.some(card => card.archiveCardId === numericId));
  const detail = useApiResource(`archive-entry:${id}`, loader, !archive.readOnly || !!section);
  const ids = section?.cards.map(card => card.archiveCardId) ?? (numericId ? [numericId] : []);
  // 홈 조회가 끝난 뒤 카드 목록을 결정해 초기 스와이프 위치를 유지한다.
  if (detail.error || !detail.data || !numericId) return <ArchiveApiState error={detail.error} retry={detail.reload} />;
  if (!archive.data && !archive.error) return <ArchiveApiState error={null} retry={archive.reload} />;
  return <Reader key={`${id}:${ids.join(',')}`} ids={ids} initialId={numericId} owned={!archive.readOnly && !!section} back={section ? `${archive.baseHref}/${section.category}` : archive.baseHref} photos={section?.cards.map(card => card.imageUrl) ?? [detail.data.imageUrl]} commentsInitiallyOpen={commentsInitiallyOpen} />;
};
const Reader = ({ ids, initialId, owned, back, photos, commentsInitiallyOpen }: { ids: number[]; initialId: number; owned: boolean; back: string; photos: (string | null)[]; commentsInitiallyOpen: boolean }) => {
  const { active, track, handlers } = useCardCarousel(ids.length, Math.max(0, ids.indexOf(initialId)), 36);
  const [comments, setComments] = useState(commentsInitiallyOpen);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const closeComments = useCallback(() => setComments(false), []);
  const photo = letterImageUrl(photos[active]);
  return <div className="relative isolate flex min-h-dvh flex-none flex-col justify-center overflow-hidden bg-cream py-[64px] md:min-h-full">
    {photo && <Image src={photo} alt="" fill unoptimized sizes="(min-width:768px) 402px,100vw" className="-z-10 object-cover" />}
    <h1 className="sr-only">아카이브 카드 상세</h1><div className="mb-[10px] flex justify-end px-[24px]"><Link href={back} aria-label="카드 상세 닫기" className="flex size-[36px] items-center justify-center rounded-control bg-white"><Image src="/icons/close.svg" alt="" width={24} height={24} /></Link></div>
    <div ref={track} {...handlers} role="region" aria-label="아카이브 마음카드" tabIndex={0}
      onPointerDownCapture={event => { handlers.onPointerDownCapture?.(event); pointerStart.current = { x: event.clientX, y: event.clientY }; moved.current = false; }}
      onPointerUpCapture={event => { handlers.onPointerUpCapture?.(event); const start = pointerStart.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) moved.current = true; pointerStart.current = null; }}
      onPointerCancelCapture={event => { handlers.onPointerCancelCapture?.(event); moved.current = true; pointerStart.current = null; }}
      onScroll={event => { handlers.onScroll?.(event); moved.current = true; }}
      onClickCapture={event => { handlers.onClickCapture?.(event); if (moved.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } }}
      className="flex shrink-0 snap-x snap-mandatory gap-[12px] overflow-x-auto overscroll-x-contain px-[24px] py-[6px] [scroll-padding-inline:24px] [scrollbar-width:none]">
      {ids.map((cardId, index) => <article key={cardId} aria-label={`아카이브 마음카드 ${index + 1}`} aria-hidden={active !== index} inert={active !== index} onClick={event => { if (!(event.target instanceof Element && event.target.closest('button,a')) && !window.getSelection()?.toString()) setComments(true); }} className="flex h-[clamp(340px,calc(100dvh_-_200px),520px)] min-w-0 basis-full shrink-0 snap-center flex-col rounded-[22px] border border-white/60 bg-white/65 px-[20px] py-[24px] shadow-lg backdrop-blur-md"><DetailSlide id={cardId} enabled={active === index} owned={owned} openComments={() => { if (!window.getSelection()?.toString()) setComments(true); }} /></article>)}
    </div>
    {comments && <ArchiveCommentsSheet key={ids[active]} cardId={ids[active]} onClose={closeComments} />}
  </div>;
};
