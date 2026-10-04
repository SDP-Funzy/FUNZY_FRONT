'use client';

import { isHeartCardWritten } from '@sdp/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CardStrip } from '@/components/write/CardStrip';
import { HeartCardEditor } from '@/components/write/HeartCardEditor';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { PageDots } from '@/components/ui/PageDots';
import { Popup } from '@/components/ui/Popup';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { ROUTES } from '@/lib/routes';

type PopupState = 'giftCardMissing' | 'emptyCard' | 'giftNotReady' | null;

/**
 * 마음카드 작성 화면 (Figma 홈화면 - 마음카드)
 * - 카드 편집, 카드 추가·넘기기(최대 4장)
 * - 전송하기: 본문이 빈 카드가 있으면 안내, 선물카드가 아직이면 "선물카드가 남았어요" 확인 → 전송 미리보기
 * 선물카드 화면은 별도 이슈에서 연결한다.
 */
export const WriteScreen = () => {
  const router = useRouter();
  const { cards, currentIndex, goTo } = useWriteDraft();
  const [popup, setPopup] = useState<PopupState>(null);

  // TODO: 선물카드 작성 이슈에서 실제 작성 여부로 교체
  const hasGiftCard = false;

  const handleSend = () => {
    const emptyIndex = cards.findIndex((card) => !isHeartCardWritten(card));
    if (emptyIndex !== -1) {
      goTo(emptyIndex);
      setPopup('emptyCard');
      return;
    }
    if (hasGiftCard) {
      router.push(ROUTES.writePreview);
      return;
    }
    setPopup('giftCardMissing');
  };

  /**
   * 선물카드 화면으로 이동
   * TODO: 선물카드 작성 이슈에서 router.push('/write/gift') 로 교체.
   * 없는 주소로 이동하면 404 화면에서 write layout 이 사라져 작성 중인 마음카드가 날아가므로, 그전까지는 안내만 띄운다.
   */
  const goToGiftCard = () => {
    setPopup('giftNotReady');
  };

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Header
        className="bg-cream"
        paddingClassName="px-[17px]"
        left={<Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority />}
      />

      <CardStrip />

      <div className="mt-[31px] px-[20px]">
        <HeartCardEditor />
      </div>

      <div className="mt-[32px] flex justify-center">
        <PageDots
          count={cards.length}
          activeIndex={currentIndex}
          onSelect={goTo}
          getLabel={(index) => `${index + 1}번째 카드로 이동`}
        />
      </div>

      <div className="mt-[29px] flex gap-[14px] px-[24px] pb-[calc(35px+env(safe-area-inset-bottom,0px))]">
        <Button variant="primary" onClick={handleSend} className="flex-1">
          전송하기
        </Button>
        <Button variant="accent" onClick={goToGiftCard} className="flex-1">
          선물카드 쓰기
        </Button>
      </div>

      <Popup
        isOpen={popup === 'giftCardMissing'}
        title="앗! 아직 선물카드가 남았어요!"
        description="선물카드가 아직 작성되지 않았습니다. 그래도 전송하시겠나요?"
        cancelLabel="선물카드 쓰기"
        confirmLabel="전송하기"
        onCancel={goToGiftCard}
        onConfirm={() => {
          setPopup(null);
          router.push(ROUTES.writePreview);
        }}
      />
      <Popup
        isOpen={popup === 'emptyCard'}
        title="아직 비어 있는 카드가 있어요"
        description="마음카드 내용을 채워주세요."
        showCancel={false}
        confirmLabel="확인"
        onCancel={() => setPopup(null)}
        onConfirm={() => setPopup(null)}
      />
      <Popup
        isOpen={popup === 'giftNotReady'}
        title="준비 중이에요"
        description="선물카드 쓰기는 곧 사용할 수 있어요."
        showCancel={false}
        confirmLabel="확인"
        onCancel={() => setPopup(null)}
        onConfirm={() => setPopup(null)}
      />
    </div>
  );
};
