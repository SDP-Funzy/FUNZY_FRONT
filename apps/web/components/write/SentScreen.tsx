'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { useGiftDraft } from '@/hooks/write/useGiftDraft';
import { ROUTES } from '@/lib/routes';
import { sharedLetterUrl } from '@/lib/letterService';

/** 봉투가 닫히는 장면 (Figma 전송 완료 3장면) */
const ENVELOPE_FRAMES = ['/images/envelope-sent-1.svg', '/images/envelope-sent-2.svg', '/images/envelope-sent-3.svg'];
/** 장면이 바뀌는 간격과, 그중 서서히 겹치며 넘어가는 시간 */
const FRAME_INTERVAL_MS = 550;

/**
 * 전송 완료 화면 (Figma "마음을 보냈어요!", 주석: 모션)
 * 편지가 봉투에 들어가 닫히는 3장면을 차례로 보여준다. 움직임 줄이기 설정이면 마지막 장면만.
 */
export const SentScreen = () => {
  const router = useRouter();
  const { reset, sentReceipt } = useWriteDraft();
  const { reset: resetGift } = useGiftDraft();
  const [frameIndex, setFrameIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');

  // 보낸 편지는 작성 내용에서 비운다. 뒤로 가기로 작성 화면에 돌아가도 같은 편지를 다시 보낼 수 없다
  useEffect(() => {
    if (!sentReceipt) { router.replace(ROUTES.write); return; }
    reset(); resetGift();
  }, [reset, resetGift, sentReceipt, router]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(() => setFrameIndex(ENVELOPE_FRAMES.length - 1), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setInterval(() => {
      setFrameIndex((index) => {
        if (index >= ENVELOPE_FRAMES.length - 1) {
          window.clearInterval(timer);
          return index;
        }
        return index + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!sentReceipt) return null;
  const shareUrl = sharedLetterUrl(sentReceipt.token);
  return (
    <div className="flex flex-1 flex-col items-center bg-cream px-page">
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* 세 장면을 겹쳐 두고 투명도만 바꾼다. 투명도가 서서히 바뀌면서 이전 장면은 사라지고 다음 장면이 나타나
            장면 사이가 자연스럽게 이어진다 (이미지를 새로 불러오지 않아 깜빡임도 없음) */}
        <div className="relative h-[139px] w-[131px]" role="img" aria-label="편지가 봉투에 담겼어요">
          {ENVELOPE_FRAMES.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              className={cn(
                'absolute inset-0 block size-full transition-opacity duration-300 ease-in-out motion-reduce:transition-none',
                index === frameIndex ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
        </div>
        <p className="mt-[31px] text-24 leading-[30px] font-semibold text-black">마음을 보냈어요!</p>
        <label htmlFor="sent-letter-link" className="mt-[24px] text-14">상대방에게 링크를 전달해 주세요.</label>
        <input id="sent-letter-link" aria-label="공유 링크" readOnly value={shareUrl} onFocus={event => event.target.select()} className="mt-[12px] min-h-[44px] w-full rounded-control border border-gray-m-100 bg-white px-[12px] text-12" />
        <Button variant="primary" fullWidth={false} className="mt-[12px] px-[24px]" onClick={async () => {
          try { await navigator.clipboard.writeText(shareUrl); setCopyStatus('링크를 복사했어요.'); }
          catch { setCopyStatus('링크를 길게 누르거나 선택해서 복사해 주세요.'); }
        }}>링크 복사하기</Button>
        <p role="status" className="mt-[8px] text-12 text-gray-m-400">{copyStatus}</p>
      </div>

      <div className="pb-[calc(94px+env(safe-area-inset-bottom,0px))]">
        <Button variant="accent" fullWidth={false} onClick={() => router.replace(ROUTES.home)} className="w-[170px]">
          확인했어요
        </Button>
      </div>
    </div>
  );
};
