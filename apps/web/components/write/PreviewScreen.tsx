'use client';

import { isHeartCardWritten } from '@sdp/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HeartCardPreview } from '@/components/write/HeartCardPreview';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Popup } from '@/components/ui/Popup';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { formatDotDate } from '@/lib/date';
import { ROUTES } from '@/lib/routes';

/**
 * 편지 전송 전 미리보기 (Figma 홈화면 - 전송하기)
 * 받는 사람이 보게 될 모습으로 카드를 옆으로 넘겨보고, 전송하기 → 확인 팝업 → 전송 완료 화면.
 */
export const PreviewScreen = () => {
  const router = useRouter();
  const { cards, photos } = useWriteDraft();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const dateLabel = formatDotDate(new Date());

  // 새로고침 등으로 작성 내용이 사라졌으면 미리볼 게 없으니 작성 화면으로
  const hasContent = cards.some(isHeartCardWritten);
  useEffect(() => {
    if (!hasContent) router.replace(ROUTES.write);
  }, [hasContent, router]);

  const handleSend = async () => {
    setIsSending(true);
    // TODO: 마음카드 API 연동 이슈에서 실제 전송(사진 업로드 → 카드 생성)으로 교체.
    //       지금은 서버에 아무것도 보내지 않고 완료 화면만 보여준다.
    // 작성 내용 비우기는 완료 화면이 열린 뒤에 한다. 여기서 먼저 비우면 위의 "내용 없음" 검사가
    // 먼저 실행되어 완료 화면 대신 작성 화면으로 튕길 수 있다.
    router.replace(ROUTES.writeSent);
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
        aria-label="보낼 마음카드 미리보기"
        className="mt-[34px] flex snap-x snap-mandatory gap-[16px] overflow-x-auto px-[48px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            aria-label={`${index + 1} / ${cards.length}`}
            className="w-[306px] max-w-full shrink-0 snap-center"
          >
            <HeartCardPreview card={card} photoUrl={photos[card.id]?.previewUrl} dateLabel={dateLabel} />
          </div>
        ))}
      </section>

      <div className="mt-auto flex justify-center pt-[40px] pb-[calc(73px+env(safe-area-inset-bottom,0px))]">
        <Button variant="primary" fullWidth={false} onClick={() => setIsConfirmOpen(true)} className="w-[170px]">
          전송하기
        </Button>
      </div>

      <Popup
        isOpen={isConfirmOpen}
        title="이제 보내볼까요?"
        description="전송하기 버튼을 누르면 진짜 전송됩니다!"
        cancelLabel="수정하기"
        confirmLabel="전송하기"
        onCancel={() => {
          setIsConfirmOpen(false);
          router.back();
        }}
        onConfirm={() => {
          if (!isSending) handleSend();
        }}
      />
    </div>
  );
};
