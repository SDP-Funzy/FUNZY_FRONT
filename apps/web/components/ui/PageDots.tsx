import { cn } from '@/lib/cn';

type PageDotsProps = {
  count: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  /** 스크린 리더용 이름. 예: (i) => `${i + 1}번째 카드로 이동` */
  getLabel: (index: number) => string;
};

/**
 * 점 인디케이터 (7px 점, 간격 15px, 현재 위치 주황)
 * 22px 버튼 가운데에 점을 둬서 간격을 맞추고 누르기 쉽게 한다.
 */
export const PageDots = ({ count, activeIndex, onSelect, getLabel }: PageDotsProps) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect?.(index)}
          aria-label={getLabel(index)}
          aria-current={index === activeIndex ? 'step' : undefined}
          className="flex size-[22px] items-center justify-center"
        >
          <span className={cn('size-[7px] rounded-full', index === activeIndex ? 'bg-orange' : 'bg-gray-m-800')} />
        </button>
      ))}
    </div>
  );
};
