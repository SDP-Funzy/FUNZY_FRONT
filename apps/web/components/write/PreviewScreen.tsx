'use client';

import { isHeartCardWritten } from '@sdp/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { HeartCardPreview } from '@/components/write/HeartCardPreview';
import { GiftCardPreview } from '@/components/write/GiftCardPreview';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Popup } from '@/components/ui/Popup';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { useGiftDraft } from '@/hooks/write/useGiftDraft';
import { formatDotDate } from '@/lib/date';
import { ROUTES } from '@/lib/routes';
import { letterFailure } from '@/lib/letterService';

/**
 * 편지 전송 전 미리보기 (Figma 홈화면 - 전송하기)
 * 받는 사람이 보게 될 모습으로 카드를 옆으로 넘겨보고, 전송하기 → 확인 팝업 → 전송 완료 화면.
 */
export const PreviewScreen = () => {
  const router = useRouter();
  const { cards, photos, sendLetter } = useWriteDraft();
  const gift = useGiftDraft();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const sending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dateLabel = formatDotDate(new Date());

  // 새로고침 등으로 작성 내용이 사라졌으면 미리볼 게 없으니 작성 화면으로
  const hasContent = cards.length > 0 && cards.every(isHeartCardWritten);
  const giftCount = gift.isComplete ? gift.cards.length : 0;
  useEffect(() => {
    if (!hasContent) router.replace(ROUTES.write);
  }, [hasContent, router]);

  const handleSend = async () => {
    if (sending.current) return;
    sending.current = true;
    setIsSending(true);
    setIsConfirmOpen(false); setSendError(null);
    try { await sendLetter(); if (mounted.current) router.replace(ROUTES.writeSent); }
    catch (error) { if (mounted.current) setSendError(letterFailure(error)); }
    finally { sending.current = false; if (mounted.current) setIsSending(false); }
  };

  if (!hasContent) return null;

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Header
        className="bg-cream"
        paddingClassName="px-[17px]"
        left={<Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority />}
      />

      <section
        aria-label="보낼 마음카드와 선물카드 미리보기"
        className="mt-[34px] flex snap-x snap-mandatory gap-[16px] overflow-x-auto px-[48px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            aria-label={`${index + 1} / ${cards.length + giftCount}`}
            className="w-[306px] max-w-full shrink-0 snap-center"
          >
            <HeartCardPreview card={card} photoUrl={photos[card.id]?.previewUrl} dateLabel={dateLabel} />
          </div>
        ))}
        {gift.isComplete && gift.cards.map((card, index) => (
          <div key={card.id} aria-label={`${cards.length + index + 1} / ${cards.length + giftCount}`} className="w-[306px] max-w-full shrink-0 snap-center">
            <GiftCardPreview card={card} photoUrl={gift.photos[card.id]?.url} date={dateLabel} index={index} />
          </div>
        ))}
      </section>

      <div className="mt-auto flex justify-center pt-[40px] pb-[calc(73px+env(safe-area-inset-bottom,0px))]">
        <Button variant="primary" fullWidth={false} disabled={isSending} onClick={() => setIsConfirmOpen(true)} className="w-[170px]">
          {isSending ? '전송 중...' : '전송하기'}
        </Button>
      </div>

      <Popup
        isOpen={isConfirmOpen}
        title="이제 보내볼까요?"
        description={gift.hasContent ? '선물카드는 아직 함께 보낼 수 없어요. 마음카드만 보내고 공유 링크를 만들까요?' : '마음카드를 보내고 공유 링크를 만들어요. 링크를 전달하면 상대방이 편지를 받을 수 있어요.'}
        cancelLabel="수정하기"
        confirmLabel={gift.hasContent ? '마음카드만 전송' : '전송하기'}
        onCancel={() => {
          setIsConfirmOpen(false);
          router.back();
        }}
        onConfirm={() => {
          if (!isSending) handleSend();
        }}
      />
      <Popup isOpen={sendError !== null} title="전송하지 못했어요" description={sendError ?? undefined} confirmLabel="다시 시도" cancelLabel="닫기" onCancel={() => setSendError(null)} onConfirm={() => { void handleSend(); }} />
    </div>
  );
};
