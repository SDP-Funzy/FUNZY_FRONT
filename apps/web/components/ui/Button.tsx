import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * 피그마 버튼 컴포넌트(Frame 2147229101) 대응
 * - primary: 검정 (Default)
 * - accent:  주황 (Variant2)
 * - muted:   회색 (Variant3). 팝업의 취소 버튼처럼 "누를 수 있는 회색 버튼"
 * disabled 이면 variant 와 상관없이 회색으로 보인다.
 */
type ButtonVariant = 'primary' | 'accent' | 'muted';

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-black',
  accent: 'bg-orange',
  muted: 'bg-gray-pc-300',
};

export const Button = ({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'flex h-[47px] w-full items-center justify-center rounded-control p-[10px]',
        'text-16 font-semibold whitespace-nowrap text-white',
        'transition-opacity active:opacity-80',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange',
        'disabled:cursor-not-allowed disabled:bg-gray-pc-300 disabled:active:opacity-100',
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
};
