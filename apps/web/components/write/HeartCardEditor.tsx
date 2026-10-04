'use client';

import { CategorySelect } from '@/components/write/CategorySelect';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { cn } from '@/lib/cn';
import { formatDotDate } from '@/lib/date';


const ARROW_BUTTON_CLASS =
  'flex size-[24px] items-center justify-center disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-orange';

/**
 * 마음카드 편집 카드 (Figma 마음카드, 362×441)
 * 카드에 바로 글을 쓰는 방식: To / 본문 / From 을 카드 위에서 직접 입력한다.
 */
export const HeartCardEditor = () => {
  const { cards, currentIndex, currentCard, updateCurrentCard, goTo } = useWriteDraft();
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;

  return (
    <article
      aria-label={`마음카드 ${currentIndex + 1} / ${cards.length}`}
      className="mx-auto flex h-[441px] w-full max-w-[362px] flex-col gap-[23px] rounded-funzy bg-white px-[24px] py-[22px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <CategorySelect
            value={currentCard.category}
            customValue={currentCard.customCategory}
            onChange={(category) => updateCurrentCard({ category })}
            onCustomChange={(customCategory) => updateCurrentCard({ customCategory })}
          />
          <span className="text-12 leading-[1.55] font-normal whitespace-nowrap text-gray-m-400">
            마음카드 {currentIndex + 1}/{cards.length}
          </span>
        </div>

        <label className="mt-[31px] flex items-center font-en text-15 font-semibold tracking-[-0.3px] text-gray-m-800">
          <span className="shrink-0">To:</span>
          <input
            aria-label="받는 사람"
            placeholder="받는 사람"
            maxLength={20}
            value={currentCard.to}
            onChange={(e) => updateCurrentCard({ to: e.target.value })}
            className="ml-[4px] min-w-0 flex-1 bg-transparent outline-none placeholder:font-sans placeholder:font-normal placeholder:text-gray-m-200"
          />
        </label>

        <textarea
          aria-label="마음카드 내용"
          placeholder="마음을 담아 적어주세요"
          value={currentCard.content}
          onChange={(e) => updateCurrentCard({ content: e.target.value })}
          className="mt-[18px] min-h-0 flex-1 resize-none bg-transparent text-15 leading-[1.6] font-normal text-gray-m-800 outline-none placeholder:text-gray-m-200"
        />

        <label className="mt-[12px] flex items-center justify-end font-en text-15 font-semibold tracking-[-0.3px] text-gray-m-800">
          <span className="shrink-0">From:</span>
          <input
            aria-label="보내는 사람"
            placeholder="보내는 사람"
            maxLength={20}
            value={currentCard.from}
            onChange={(e) => updateCurrentCard({ from: e.target.value })}
            className="ml-[4px] w-[50%] bg-transparent text-right outline-none placeholder:font-sans placeholder:font-normal placeholder:text-gray-m-200"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" aria-label="이전 카드" disabled={isFirst} onClick={() => goTo(currentIndex - 1)} className={ARROW_BUTTON_CLASS}>
          <img src="/icons/chevron-left.svg" alt="" className="block" />
        </button>
        <span className="font-en text-12 font-medium tracking-[-0.3px] text-gray-m-800">{formatDotDate(new Date())}</span>
        <button type="button" aria-label="다음 카드" disabled={isLast} onClick={() => goTo(currentIndex + 1)} className={ARROW_BUTTON_CLASS}>
          <img src="/icons/chevron-left.svg" alt="" className={cn('block -scale-x-100')} />
        </button>
      </div>
    </article>
  );
};
