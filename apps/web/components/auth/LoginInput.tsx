import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * 로그인 화면 전용 입력칸 (Figma 로그인 "입력칸")
 * 공통 Input 과 크기·테두리·굵기가 달라서 따로 둔다. (320×48, #B6B6B6, Regular)
 * 화면에 보이는 라벨이 없으므로 aria-label 을 꼭 넘길 것.
 */
type LoginInputProps = ComponentPropsWithRef<'input'> & {
  'aria-label': string;
};

export const LoginInput = ({ className, ...props }: LoginInputProps) => {
  return (
    <input
      className={cn(
        'h-[48px] w-full rounded-control border border-gray-m-200 bg-white pr-[8px] pl-[15px]',
        'text-16 leading-[1.5] font-normal text-gray-m-800 outline-none placeholder:text-gray-m-200',
        // 피그마에 포커스 상태가 없어서 테두리만 진하게 (디자이너 확인 필요)
        'focus:border-gray-m-400',
        className,
      )}
      {...props}
    />
  );
};
