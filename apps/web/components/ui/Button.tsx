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
  /**
   * true(기본)면 부모 폭을 꽉 채운다. 고정 폭 버튼은 false 로 두고 className 으로 폭을 준다.
   * (w-full 이 켜진 채로 w-[158px] 을 넘기면 CSS 순서상 w-full 이 이겨서 폭이 안 바뀐다)
   */
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-black',
  accent: 'bg-orange',
  muted: 'bg-gray-pc-300',
};

export const Button = ({ variant = 'primary', fullWidth = true, type = 'button', className, ...props }: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'flex h-[47px] items-center justify-center rounded-control p-[10px]',
        fullWidth && 'w-full',
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
