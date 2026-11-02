'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import type { SharedLetter } from '@sdp/core';
import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';
import { HeartCardPreview } from '@/components/write/HeartCardPreview';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { useApiResource } from '@/hooks/common/useApiResource';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { letterFailure, letterRepository, loadSharedLetter } from '@/lib/letterService';
import { asLetterView } from '@/lib/letterView';
import { authPathWithReturn, SHARED_LETTER_PATH } from '@/lib/sharedLetterReturn';

const SharedLetterView = ({ token, initialCard, shared, replace }: { token: string; initialCard?: string; shared: SharedLetter; replace: (next: SharedLetter) => void }) => {
  const letter = asLetterView(shared.letter);
  const pageIds = [...(letter?.cards.map(item => item.card.id) ?? []), ...(letter?.gifts.map(gift => gift.id) ?? [])];
  const initialIndex = initialCard ? pageIds.indexOf(initialCard) : -1;
  const [opened, setOpened] = useState(initialIndex >= 0);
  const [pendingGift, setPendingGift] = useState<string | null>(null);
  const selectedGift = letter.selectedGiftId;
  const [choosing, setChoosing] = useState(false);
  const [chooseError, setChooseError] = useState<string | null>(null);
  const choosingRef = useRef(false);
  const [announcement, setAnnouncement] = useState('');
  const { active, track, handlers } = useCardCarousel(opened ? pageIds.length : 0, Math.max(0, initialIndex));
  const { status } = useAuth();
  const router = useRouter();
  const choose = async (giftId: number) => {
    if (status !== 'authenticated') { setPendingGift(`gift-${giftId}`); return; }
    if (shared.viewer !== 'RECIPIENT') { setChooseError(shared.viewer === 'SENDER' ? '보낸 사람은 선물을 고를 수 없어요.' : '다른 사람이 받은 편지라 선물을 고를 수 없어요.'); return; }
    if (choosingRef.current) return;
    choosingRef.current = true; setChoosing(true);
    try { const updated = await letterRepository.chooseGift(shared.letter.letterId, giftId); replace({ ...shared, letter: updated }); setAnnouncement('선물을 선택했어요.'); }
    catch (error) { setChooseError(letterFailure(error)); }
    finally { choosingRef.current = false; setChoosing(false); }
  };

  if (!opened) return <div className="flex min-h-dvh flex-none flex-col items-center justify-center bg-cream px-[36px] py-[60px] md:min-h-full">
    <h1 className="sr-only">{letter.recipient}님에게 편지가 왔어요</h1>
    <div className="relative aspect-[131/139] w-full max-w-[300px]">
      <span aria-hidden="true" className="absolute -top-[30px] left-1/2 -translate-x-1/2 border-x-[42px] border-b-[32px] border-x-transparent border-b-orange" />
      <Image src="/images/envelope-sent-1.svg" alt="" fill sizes="300px" priority className="object-contain" />
      <Link href={status === 'authenticated' ? ROUTES.home : ROUTES.onboarding} aria-label="공유 편지 닫기" className="absolute -top-[16px] -right-[12px] flex size-[44px] items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={28} height={28} /></Link>
      <div className="absolute inset-x-[12%] top-[12%] text-center text-black"><p className="text-18 font-bold">헐?</p><p className="mt-[18px] text-16 leading-[1.6]">{letter.recipient}님에게<br />편지가 왔어요!</p></div>
      <Button fullWidth={false} onClick={() => setOpened(true)} className="absolute bottom-[9%] left-1/2 w-[170px] -translate-x-1/2">카드 보러가기</Button>
    </div>
  </div>;

  return <div className="flex min-h-dvh flex-none flex-col bg-gray-pc-800 py-[32px] text-white md:min-h-full">
    <div className="shrink-0 px-[24px]"><Image src="/images/logo-funzy-orange.png" alt="Funzy" width={74} height={56} className="h-[56px] w-[74px] object-contain" />
      <h1 className="mt-[20px] text-24 font-bold">카드가 도착했어요</h1>
      <div className="mt-[4px] flex items-start justify-between gap-[12px]"><p className="text-14">{letter.sender}님이 주고 싶은 마음이 도착했어요!</p><button type="button" aria-label="카드 열람 닫기" onClick={() => setOpened(false)} className="flex size-[36px] shrink-0 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={20} height={20} className="invert mix-blend-screen" /></button></div>
    </div>
    <p id="shared-letter-help" className="sr-only">카드를 좌우로 넘기거나 방향키로 이동할 수 있어요. 선물을 고르려면 로그인해 주세요.</p>
    <div ref={track} {...handlers} role="region" aria-label="공유 편지 카드" aria-describedby="shared-letter-help" tabIndex={0}
      className="mt-[26px] flex shrink-0 cursor-grab snap-x snap-mandatory gap-[16px] overflow-x-auto overscroll-x-contain px-[32px] py-[4px] select-none [--shared-card-height:clamp(300px,calc(100dvh_-_340px),520px)] [scroll-padding-inline:32px] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-orange active:cursor-grabbing [&::-webkit-scrollbar]:hidden">
      {letter.cards.map((item, index) => <article key={item.card.id} aria-label={`마음카드 ${index + 1}`} aria-hidden={active !== index} inert={active !== index} className="flex h-[var(--shared-card-height)] min-w-0 basis-full shrink-0 snap-center items-center justify-center">
        <div style={{ width: 'min(100%, calc(var(--shared-card-height) * 306 / 449))' }}><HeartCardPreview card={item.card} photoUrl={item.photo} dateLabel={letter.date} scrollable /></div>
      </article>)}
      {letter.gifts.map((gift, index) => <button key={gift.id} type="button" disabled={choosing} aria-label={`선물 후보 ${index + 1}: ${gift.label}`} aria-pressed={selectedGift === gift.id} aria-haspopup={status === 'authenticated' ? undefined : 'dialog'} aria-hidden={active !== letter.cards.length + index} inert={active !== letter.cards.length + index}
        onClick={() => { void choose(gift.giftItemId); }}
        className={cn('relative h-[var(--shared-card-height)] min-w-0 basis-full shrink-0 snap-center overflow-hidden rounded-[20px] border-[3px] bg-white p-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange', selectedGift === gift.id || pendingGift === gift.id ? 'border-orange' : 'border-transparent')}>
        <span aria-hidden="true" className={cn('absolute top-[18px] left-[18px] z-10 size-[28px] rounded-full', selectedGift === gift.id || pendingGift === gift.id ? 'border-[5px] border-white bg-orange ring-1 ring-orange' : 'bg-gray-m-100')} />
        <span className="flex h-full flex-col items-center justify-center gap-[20px] text-black"><span className="text-24 font-bold break-words">{gift.label}</span>{letter.reason && <span className="text-14 leading-[1.7] break-words">{letter.reason}</span>}</span>
      </button>)}
    </div>
    <p role="status" className="sr-only">{announcement}</p>
    <div className="mt-auto flex justify-center px-[24px] pt-[24px] pb-safe">
      {status !== 'authenticated' ? <Button variant="accent" fullWidth={false} className="px-[24px]" onClick={() => router.push(authPathWithReturn(ROUTES.login, `${SHARED_LETTER_PATH}/${encodeURIComponent(token)}?card=${encodeURIComponent(pageIds[active] ?? '')}`))}>로그인하고 편지 받기</Button>
        : shared.viewer === 'RECIPIENT' && <Link href={`/letterbox/${shared.letter.letterId}`} className="rounded-control bg-orange px-[24px] py-[14px] text-14 text-white">보관함에서 보기</Link>}
    </div>
    <Popup isOpen={pendingGift !== null} title="선물을 고르고 싶으면 로그인을 해야 해요" description="해당 카드가 더 궁금하시다면 로그인을 해주세요! 펀지와 더 함께해요." cancelLabel="나중에" confirmLabel="로그인하기" onCancel={() => setPendingGift(null)} onConfirm={() => {
      const returnTo = `${SHARED_LETTER_PATH}/${encodeURIComponent(token)}?card=${encodeURIComponent(pendingGift ?? pageIds[active])}`;
      setPendingGift(null); router.push(authPathWithReturn(ROUTES.login, returnTo));
    }} />
    <Popup isOpen={chooseError !== null} title="선물을 선택할 수 없어요" description={chooseError ?? undefined} showCancel={false} onCancel={() => setChooseError(null)} onConfirm={() => setChooseError(null)} />
  </div>;
};

export const SharedLetterScreen = ({ token, initialCard }: { token: string; initialCard?: string }) => {
  const { status } = useAuth();
  const loader = useCallback((signal: AbortSignal) => loadSharedLetter(token, status === 'authenticated', signal), [token, status]);
  const resource = useApiResource(`shared:${token}:${status}`, loader, status !== 'loading');
  if (!resource.data) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px] text-center">
    {resource.error ? <><h1 className="text-18 font-bold">편지를 불러오지 못했어요.</h1><p role="alert" className="text-14 text-error">{letterFailure(resource.error)}</p><Button fullWidth={false} onClick={resource.reload} className="px-[24px]">다시 시도</Button></> : <p role="status" className="text-14 text-gray-m-400">편지를 불러오고 있어요.</p>}
    <Link href={status === 'authenticated' ? ROUTES.letterbox : ROUTES.onboarding} className="flex min-h-[44px] items-center text-14 underline">돌아가기</Link>
  </div>;
  return <SharedLetterView key={`${token}:${status}`} token={token} initialCard={initialCard} shared={resource.data} replace={resource.replace} />;
};
