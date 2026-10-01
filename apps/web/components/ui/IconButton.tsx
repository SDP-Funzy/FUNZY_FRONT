import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * 아이콘만 있는 버튼 (뒤로가기, 검색 등)
 * 아이콘은 피그마에서 export 한 SVG 를 public/icons 에 두고 경로로 넘긴다.
 * 터치 영역은 44px 을 기본으로 확보한다.
 */
type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  iconSrc: string;
  /** 스크린 리더용 이름. 예: "뒤로가기" */
  label: string;
};

export const IconButton = ({ iconSrc, label, type = 'button', className, ...props }: IconButtonProps) => {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'flex size-[44px] shrink-0 items-center justify-center rounded-full',
        'focus-visible:outline-2 focus-visible:outline-orange',
        className,
      )}
      {...props}
    >
      <img src={iconSrc} alt="" className="block" />
    </button>
  );
};
