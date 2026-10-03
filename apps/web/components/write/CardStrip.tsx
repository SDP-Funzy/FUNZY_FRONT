'use client';

import { canAddHeartCard } from '@sdp/core';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Popup } from '@/components/ui/Popup';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { cn } from '@/lib/cn';
import { checkCardPhoto, MAX_CARD_PHOTO_BYTES } from '@/lib/imageFile';

/** 지금 카드가 스크롤 영역 끝에 딱 붙지 않도록 남길 여유 */
const SCROLL_MARGIN = 8;

/**
 * 카드 위쪽 줄 (Figma: 카메라 칸 + 카드 썸네일 + 추가 칸)
 * - 썸네일 하나가 카드 하나이고, 지금 카드 위에 주황 삼각형 표시가 붙는다.
 * - 카드가 많아지면 썸네일 부분만 가로로 밀어서 본다. 카메라 칸은 고정
 * - 화살표·점으로 카드를 넘기면 지금 카드가 보이도록 자동으로 스크롤한다.
 * - 카메라 칸을 누르면 기기 기본 사진 선택 화면이 뜨고, 고른 사진이 지금 카드의 썸네일이 된다.
 *   (웹은 사진첩을 직접 읽을 수 없어서 피그마의 사진 격자 바텀시트 대신 기본 선택 화면을 쓴다)
 */

const PHOTO_ERROR_MESSAGES = {
  notImage: '사진 파일만 올릴 수 있어요.',
  tooLarge: `${MAX_CARD_PHOTO_BYTES / 1024 / 1024}MB 이하의 사진만 올릴 수 있어요.`,
} as const;
export const CardStrip = () => {
  const { cards, currentIndex, currentCard, photos, goTo, addCard, setCurrentCardPhoto } = useWriteDraft();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const hasCurrentPhoto = Boolean(photos[currentCard.id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 사진을 다시 골라도 change 가 일어나도록 값을 비운다
    e.target.value = '';
    if (!file) return;

    const check = checkCardPhoto(file);
    if (!check.ok) {
      setPhotoError(PHOTO_ERROR_MESSAGES[check.reason]);
      return;
    }
    setCurrentCardPhoto(file);
  };
  const isAddable = canAddHeartCard(cards.length);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const container = scrollRef.current;
    const item = itemRefs.current[currentIndex];
    if (!container || !item) return;

    // scrollIntoView 는 페이지 전체까지 움직일 수 있어서 썸네일 줄만 직접 스크롤한다.
    // 위치는 화면 좌표 차이로 구해서 스크롤 영역 기준 값으로 바꾼다 (offsetLeft 는 다른 조상 기준일 수 있음)
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const itemLeft = itemRect.left - containerRect.left + container.scrollLeft;
    const itemRight = itemLeft + itemRect.width;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;

    if (itemLeft < viewLeft) {
      container.scrollTo({ left: itemLeft - SCROLL_MARGIN, behavior: 'smooth' });
    } else if (itemRight > viewRight) {
      container.scrollTo({ left: itemRight - container.clientWidth + SCROLL_MARGIN, behavior: 'smooth' });
    }
  }, [currentIndex, cards.length]);

  return (
    <div className="flex items-end pl-[24px]">
      <button
        type="button"
        aria-label={hasCurrentPhoto ? `${currentIndex + 1}번째 카드 사진 바꾸기` : `${currentIndex + 1}번째 카드에 사진 추가`}
        onClick={() => fileInputRef.current?.click()}
        className="flex h-[69px] w-[95px] shrink-0 items-center justify-center rounded-[6px] bg-gray-m-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
      >
        <img src="/icons/camera.svg" alt="" className="block" />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* 위쪽 여백(17px)을 스크롤 영역 안에 둬야 주황 삼각형이 잘리지 않는다 */}
      <div
        ref={scrollRef}
        className="ml-[33px] min-w-0 flex-1 overflow-x-auto pt-[17px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ol className="flex w-max items-end gap-[4px] pr-[24px]">
          {cards.map((card, index) => {
            const isCurrent = index === currentIndex;
            return (
              <li
                key={card.id}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className="relative"
              >
                {isCurrent && (
                  <img
                    src="/icons/current-marker.svg"
                    alt=""
                    className="absolute -top-[17px] left-1/2 block -translate-x-1/2"
                  />
                )}
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`${index + 1}번째 카드`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'block h-[69px] w-[42px] overflow-hidden rounded-[6px] bg-gray-m-50',
                    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange',
                  )}
                >
                  {photos[card.id] && (
                    <img src={photos[card.id]!.previewUrl} alt="" className="block size-full object-cover" />
                  )}
                </button>
              </li>
            );
          })}
          {isAddable && (
            <li>
              <button
                type="button"
                onClick={addCard}
                aria-label="카드 추가"
                className="flex h-[69px] w-[42px] items-center justify-center rounded-[6px] border border-gray-m-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange"
              >
                <img src="/icons/plus.svg" alt="" className="block" />
              </button>
            </li>
          )}
        </ol>
      </div>

      <Popup
        isOpen={photoError !== null}
        title="사진을 올릴 수 없어요"
        description={photoError ?? undefined}
        showCancel={false}
        confirmLabel="확인"
        onCancel={() => setPhotoError(null)}
        onConfirm={() => setPhotoError(null)}
      />
    </div>
  );
};
