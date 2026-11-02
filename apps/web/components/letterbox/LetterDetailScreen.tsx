'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { LetterCommentsSheet } from '@/components/letterbox/LetterCommentsSheet';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { Popup } from '@/components/ui/Popup';
import { ROUTES } from '@/lib/routes';

export const LetterDetailScreen = ({ senderId, letterId, backHref, allowHide = true }: { senderId: string; letterId: string; backHref?: string; allowHide?: boolean }) => {
  const { letters, toggleFavorite, hide, unhide } = useLetterboxPreview();
  const letter = letters.find(item => item.id === letterId && item.senderId === senderId);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const track = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const gestureMoved = useRef(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);
  const closeComments = useCallback(() => setCommentsOpen(false), [setCommentsOpen]);
  const back = backHref ?? `${ROUTES.letterbox}/${senderId}`;
  const openComments = (event: MouseEvent<HTMLElement>) => {
    if (event.detail !== 0 && gestureMoved.current) return;
    if (window.getSelection()?.toString()) return;
    setCommentsOpen(true);
  };

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(() => { node.scrollTo({ left: activeRef.current * (node.clientWidth - 36), behavior: 'instant' }); });
    observer.observe(node);
    return () => observer.disconnect();
  }, [letter?.hidden]);

  const goTo = (index: number) => {
    if (!track.current || !letter) return;
    const next = Math.min(letter.pages.length - 1, Math.max(0, index));
    track.current.scrollTo({ left: next * (track.current.clientWidth - 36), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  if (!letter || letter.hidden) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px] text-center">
    <h1 className="text-18 font-bold">{letter ? '숨긴 편지예요.' : '편지를 찾을 수 없어요.'}</h1>
    <p className="text-14 text-gray-m-400">{letter ? '내용을 보려면 숨김을 해제해 주세요.' : '보관함에서 편지를 다시 선택해 주세요.'}</p>
    {letter && <button type="button" onClick={() => setConfirmShow(true)} className="min-h-[47px] w-full rounded-control bg-black px-[20px] text-14 font-semibold text-white">숨김 해제</button>}
    <Link href={back} className="flex min-h-[44px] items-center justify-center px-[12px] text-14 underline underline-offset-4">카드 목록으로 돌아가기</Link>
    <Popup isOpen={confirmShow} title="편지 숨김을 해제할까요?" description="전체 목록에 다시 표시됩니다." confirmLabel="숨김 해제" onCancel={() => setConfirmShow(false)} onConfirm={() => { unhide(letterId); setConfirmShow(false); }} />
  </div>;

  return <div className="relative isolate flex min-h-dvh flex-1 flex-col justify-center overflow-hidden bg-gray-m-100 pb-safe md:min-h-full">
    <Image src={letter.image} alt="" fill sizes="(min-width: 768px) 402px, 100vw" priority className="-z-10 object-cover" />
    <h1 className="sr-only">{letter.sender}의 편지 상세</h1>
    <div className="py-[72px]">
      <div className="mb-[10px] flex justify-end px-[24px]">
        <Link href={back} aria-label="카드 상세 닫기" className="flex size-[36px] items-center justify-center rounded-control bg-white focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={24} height={24} /></Link>
      </div>
      <div ref={track} role="region" aria-label="마음카드" aria-roledescription="캐러셀" tabIndex={0}
        onScroll={event => { gestureMoved.current = true; const node = event.currentTarget; const next = Math.min(letter.pages.length - 1, Math.max(0, Math.round(node.scrollLeft / (node.clientWidth - 36)))); activeRef.current = next; setActive(next); }}
        onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goTo(active + (event.key === 'ArrowRight' ? 1 : -1)); } }}
        className="flex snap-x snap-mandatory gap-[12px] overflow-x-auto overscroll-x-contain px-[24px] py-[6px] [scroll-padding-inline:24px] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-orange [&::-webkit-scrollbar]:hidden">
        {letter.pages.map((page, index) => <article key={page.id} role="group" aria-roledescription="슬라이드" aria-label={`마음카드 ${index + 1}/${letter.pages.length}`} aria-hidden={index !== active} inert={index !== active}
          onPointerDownCapture={event => { pointerStart.current = { x: event.clientX, y: event.clientY }; gestureMoved.current = false; }}
          onPointerUpCapture={event => { const start = pointerStart.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) gestureMoved.current = true; pointerStart.current = null; }}
          onPointerCancelCapture={() => { gestureMoved.current = true; pointerStart.current = null; }}
          onClick={event => { if (event.target instanceof Element && event.target.closest('button, a')) return; openComments(event); }}
          className="flex h-[min(58dvh,520px)] min-h-[340px] min-w-0 basis-full shrink-0 snap-center flex-col rounded-[22px] border border-white/60 bg-white/55 px-[20px] py-[24px] text-black shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="mb-[24px] flex shrink-0 items-center justify-between gap-[8px]">
            <p className="min-w-0 font-en text-14 font-semibold break-words">To: {letter.to}</p>
            <div className="flex shrink-0">
              <button type="button" aria-label="편지 즐겨찾기" aria-pressed={letter.favorite} onClick={() => toggleFavorite(letterId)} className="flex size-[36px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><Image src={letter.favorite ? '/icons/favorite-active.svg' : '/icons/favorite-inactive.svg'} alt="" width={24} height={24} /></button>
              {allowHide && <button type="button" aria-label="편지 숨기기" onClick={() => setConfirmHide(true)} className="flex size-[36px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/letter-unlock.svg" alt="" width={26} height={26} /></button>}
            </div>
          </div>
          <button type="button" aria-label={`마음카드 ${index + 1} 댓글 열기`} onClick={openComments} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[4px] text-left text-14 leading-[1.8] break-words whitespace-pre-wrap select-text focus-visible:outline-2 focus-visible:outline-orange">{page.content}</button>
          <div className="mt-[20px] shrink-0 text-right font-en text-14">
            <p className="font-semibold">From: {letter.sender}</p>
            <p className="mt-[6px] text-12">{letter.date.replaceAll('-', '.')}</p>
          </div>
        </article>)}
      </div>
    </div>
    <Popup isOpen={confirmHide} title="편지를 숨길까요?" description="전체·즐겨찾기 목록에서 제외됩니다. 잠긴편지 목록에서 다시 표시할 수 있어요." confirmLabel="숨기기" onCancel={() => setConfirmHide(false)} onConfirm={() => { setConfirmHide(false); hide(letterId); }} />
    {commentsOpen && <LetterCommentsSheet letterId={letterId} onClose={closeComments} />}
  </div>;
};
