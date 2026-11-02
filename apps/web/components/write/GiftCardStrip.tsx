'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Popup } from '@/components/ui/Popup';
import { GiftArtwork } from '@/components/write/GiftArtwork';
import { useGiftDraft } from '@/hooks/write/useGiftDraft';
import { MAX_GIFT_CARDS } from '@/lib/giftDraft';
import { prepareGiftPhoto } from '@/lib/giftPhoto';

export const GiftCardStrip = () => {
  const { cards, index, currentCard, photos, add, select, setPhoto } = useGiftDraft();
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const currentCards = useRef(cards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { currentCards.current = cards; }, [cards]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const targetId = currentCard.id;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const photo = await prepareGiftPhoto(file);
      if (!mounted.current || request !== requestId.current || !currentCards.current.some(card => card.id === targetId)) {
        URL.revokeObjectURL(photo.url);
        return;
      }
      setPhoto(targetId, photo);
    } catch (cause) {
      if (mounted.current && request === requestId.current) setError(cause instanceof Error ? cause.message : '사진을 읽을 수 없어요.');
    } finally {
      if (mounted.current && request === requestId.current) setLoading(false);
    }
  };

  return (
    <div className="flex items-end gap-[28px] px-[24px]">
      <button type="button" aria-label="선물카드에 사진 추가" disabled={loading} onClick={() => input.current?.click()}
        className="flex h-[69px] w-[95px] shrink-0 items-center justify-center rounded-[6px] bg-gray-m-100 focus-visible:outline-2 focus-visible:outline-orange disabled:opacity-50">
        {loading ? <span className="text-12">읽는 중...</span> : <Image src="/icons/camera.svg" alt="" width={32} height={25} />}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" aria-label="선물 사진 선택" className="hidden" onChange={(event) => { void choosePhoto(event); }} />
      <ol className="flex min-w-0 flex-1 items-end gap-[4px] overflow-x-auto pt-[17px] pb-[2px]">
        {cards.map((card, cardIndex) => (
          <li key={card.id} className="relative shrink-0">
            {index === cardIndex && <Image src="/icons/current-marker.svg" alt="" width={10} height={9} className="absolute -top-[17px] left-1/2 block -translate-x-1/2" />}
            <button type="button" aria-label={`${cardIndex + 1}번째 선물카드`} aria-current={index === cardIndex ? 'true' : undefined} onClick={() => select(cardIndex)}
              className="flex h-[69px] w-[42px] items-center overflow-hidden rounded-[6px] bg-gray-m-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange">
              <GiftArtwork card={card} photoUrl={photos[card.id]?.url} label={`${cardIndex + 1}번째 선물 그림 미리보기`} />
            </button>
          </li>
        ))}
        {cards.length < MAX_GIFT_CARDS && <li className="shrink-0"><button type="button" aria-label="선물카드 추가" onClick={add}
          className="flex h-[69px] w-[42px] items-center justify-center rounded-[6px] border border-gray-m-300 focus-visible:outline-2 focus-visible:outline-orange">
          <Image src="/icons/plus.svg" alt="" width={22} height={22} />
        </button></li>}
      </ol>
      <Popup isOpen={error !== null} title="사진을 올릴 수 없어요" description={error ?? undefined} showCancel={false}
        onCancel={() => setError(null)} onConfirm={() => setError(null)} />
    </div>
  );
};
