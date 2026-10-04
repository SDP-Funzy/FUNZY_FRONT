import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * 로그인 화면 전용 입력칸 (Figma 로그인 "입력칸")
 * 공통 Input 과 크기·테두리·굵기가 달라서 따로 둔다. (320×48, #B6B6B6, Regular)
 * 화면에 보이는 라벨이 없으므로 aria-label 을 꼭 넘길 것.
 */
type LoginInputProps = ComponentPropsWithRef<'input'> & {
  'aria-label': string;
  isError?: boolean;
};

export const LoginInput = ({ className, isError = false, ...props }: LoginInputProps) => {
  return (
    <input
      aria-invalid={isError || undefined}
      className={cn(
        'h-[48px] w-full rounded-control border bg-white pr-[8px] pl-[15px]',
        'text-16 leading-[1.5] font-normal text-gray-m-800 outline-none placeholder:text-gray-m-200',
        // 테두리 색은 한 번만 지정해야 한다 (두 색 클래스가 같이 있으면 CSS 순서에 따라 엉뚱한 색이 이김)
        // 피그마에 포커스·에러 상태가 없어서 임의로 지정 (디자이너 확인 필요)
        isError ? 'border-error' : 'border-gray-m-200 focus:border-gray-m-400',
        className,
      )}
      {...props}
    />
  );
};
