import type { HeartCardDraft } from '@sdp/core';

type HeartCardPreviewProps = {
  card: HeartCardDraft;
  photoUrl?: string;
  /** 보내는 날짜 (예: 2026.08.18) */
  dateLabel: string;
};

/**
 * 받는 사람에게 보이는 마음카드 모습 (Figma 전송하기 미리보기)
 * - 사진이 있으면 카드 전체 배경, 없으면 주황 배경
 * - 그 위 반투명 흰 상자에 To / 본문 / From / 날짜
 */
export const HeartCardPreview = ({ card, photoUrl, dateLabel }: HeartCardPreviewProps) => {
  return (
    <div className="relative aspect-[306/449] w-full overflow-hidden rounded-[20px] bg-orange">
      {photoUrl && <img src={photoUrl} alt="" className="absolute inset-0 size-full object-cover" />}

      <div className="absolute inset-x-[9%] top-[16%] flex h-[68%] flex-col justify-center rounded-funzy bg-white/30 px-[15px] py-[17px] shadow-[0_1.4px_7.5px_rgba(0,0,0,0.55)]">
        <div className="flex min-h-0 flex-col gap-[24px]">
          <p className="font-en text-[11px] font-semibold tracking-[-0.22px] text-gray-m-800">To: {card.to}</p>
          <p className="min-h-0 overflow-hidden text-[11px] leading-[1.6] font-normal break-words whitespace-pre-wrap text-black">
            {card.content}
          </p>
          <div className="flex flex-col gap-[6px] text-right text-gray-m-800">
            <p className="font-en text-[11px] font-semibold tracking-[-0.22px]">From: {card.from}</p>
            <p className="text-[9px] font-medium tracking-[-0.23px]">{dateLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
