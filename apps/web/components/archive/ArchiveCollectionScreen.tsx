'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArchiveAddCardsForm } from '@/components/archive/ArchiveForms';
import { useArchivePreview } from '@/components/archive/ArchivePreviewProvider';
import { Header } from '@/components/ui/Header';
import { Popup } from '@/components/ui/Popup';
import { ROUTES } from '@/lib/routes';

export const ArchiveCollectionScreen = ({ collectionId }: { collectionId: string }) => {
  const { collections, visibleEntries, letters, removeEntry, setScope } = useArchivePreview();
  const collection = collections.find(item => item.id === collectionId);
  const cards = visibleEntries.filter(entry => entry.collectionId === collectionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [cardsForm, setCardsForm] = useState(false);
  const startX = useRef<number | null>(null);
  const active = Math.max(0, cards.findIndex(entry => entry.id === selectedId));
  const entry = cards[active];
  const letter = letters.find(item => item.id === entry?.letterId);
  const go = (offset: number) => { const next = cards[Math.min(cards.length - 1, Math.max(0, active + offset))]; if (next) setSelectedId(next.id); };
  return <div className="flex flex-1 flex-col bg-cream pb-[32px]">
    <Header title={collection?.title ?? '아카이브'} className="bg-cream" left={<Link href={ROUTES.archive} aria-label="아카이브로 돌아가기" className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} /></Link>} />
    <p className="px-page pt-[12px] text-12 text-gray-m-400">샘플 아카이브 · {cards.length}개 카드 · 변경사항은 저장되지 않아요.</p>
    {!collection ? <p className="px-page py-[80px] text-center text-14 text-gray-m-500">아카이브 묶음을 찾을 수 없어요.</p> : !entry || !letter ? <div className="px-page py-[80px] text-center text-14 text-gray-m-500"><p>현재 공개 범위에 표시할 카드가 없어요.</p><button type="button" onClick={() => setCardsForm(true)} className="mt-[16px] min-h-[44px] rounded-control bg-black px-[20px] text-white">카드 담기</button></div> : <>
      <div role="region" aria-label="아카이브 카드 미리보기" tabIndex={0} className="relative mx-[clamp(20px,7.7vw,31px)] mt-[38px] aspect-[280/460] overflow-hidden rounded-[20px] bg-gray-m-100 focus-visible:outline-2 focus-visible:outline-orange" style={{ touchAction: 'pan-y' }}
        onPointerDown={event => { startX.current = event.isPrimary && event.button === 0 ? event.clientX : null; }} onPointerCancel={() => { startX.current = null; }}
        onPointerUp={event => { if (startX.current !== null && Math.abs(event.clientX - startX.current) > 50) go(event.clientX < startX.current ? 1 : -1); startX.current = null; }}
        onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(event.key === 'ArrowLeft' ? -1 : 1); } }}>
        <Image src={letter.image} alt={`${letter.sender}의 카드 사진`} fill sizes="(min-width: 768px) 340px, 85vw" className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <Image src="/images/letterbox/sample-avatar.jpg" alt="보낸 사람 샘플 프로필" width={40} height={40} className="absolute top-[16px] left-[16px] size-[40px] rounded-full border-2 border-black object-cover" />
        <button type="button" aria-label="아카이브에서 카드 삭제" onClick={() => setRemoveId(entry.id)} className="absolute top-[12px] right-[12px] flex size-[44px] items-center justify-center focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={22} height={22} /></button>
        {entry.visibility === 'private' && <span className="absolute top-[64px] left-[16px] rounded-full bg-black/60 px-[10px] py-[6px] text-12 text-white">나만 보기</span>}
        <div className="absolute inset-x-[20px] bottom-[20px] flex items-end justify-between gap-[12px] text-white"><div className="min-w-0"><p className="truncate text-14 font-semibold">From: {letter.sender}</p><p className="mt-[4px] text-12">{letter.date.replaceAll('-', '.')}</p></div>
          <Link href={`${ROUTES.archive}/${collection.id}/${entry.id}`} className="flex min-h-[44px] shrink-0 items-center rounded-full bg-white px-[20px] text-14 font-semibold text-black focus-visible:outline-2 focus-visible:outline-orange">더보기 →</Link>
        </div>
      </div>
      <div className="mt-[16px] flex items-center justify-between px-page text-14"><button type="button" aria-label="이전 아카이브 카드" disabled={active === 0} onClick={() => go(-1)} className="min-h-[44px] px-[12px] disabled:text-gray-m-200">이전</button><p role="status">{active + 1} / {cards.length}</p><button type="button" aria-label="다음 아카이브 카드" disabled={active === cards.length - 1} onClick={() => go(1)} className="min-h-[44px] px-[12px] disabled:text-gray-m-200">다음</button></div>
    </>}
    <Popup isOpen={removeId !== null} title="아카이브에서 삭제하시겠습니까?" description={`“${collection?.title ?? ''}” 묶음에서만 삭제됩니다. 원본 편지와 댓글은 보관함에 남아요. 미리보기에서만 반영됩니다.`} onCancel={() => setRemoveId(null)} onConfirm={() => { if (removeId) removeEntry(removeId); setRemoveId(null); }} />
    {cardsForm && collection && <ArchiveAddCardsForm initialCategory={collection.categoryId} onClose={() => setCardsForm(false)} onAdded={() => { setScope('friends'); setCardsForm(false); }} />}
  </div>;
};
