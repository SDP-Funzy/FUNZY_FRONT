'use client';

import { useId, useState } from 'react';
import type { ComponentPropsWithRef, FocusEvent } from 'react';

import { cn } from '@/lib/cn';

/**
 * 피그마 인풋 컴포넌트(Frame 2147229125) 대응
 * - Default / Filled: 회색 테두리 (값 유무는 글자색으로만 구분)
 * - Focus: 연한 테두리 + 값이 있으면 지우기 버튼
 * - Error: 빨간 테두리 (+ hints 로 아래 체크 문구)
 * - 중복:  action 으로 오른쪽 주황 버튼 (예: 중복확인)
 * 지우기 버튼을 쓰려면 controlled(value + onChange) 로 사용하고 onClear 를 넘긴다.
 */
type InputHint = {
  label: string;
  /** true: 주황 체크, false: 회색 체크 */
  isActive: boolean;
};

type InputAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type InputProps = ComponentPropsWithRef<'input'> & {
  isError?: boolean;
  hints?: InputHint[];
  onClear?: () => void;
  action?: InputAction;
  wrapperClassName?: string;
};

export const Input = ({
  isError = false,
  hints,
  onClear,
  action,
  wrapperClassName,
  className,
  onFocus,
  onBlur,
  value,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hintId = useId();

  const hasValue = value !== undefined && String(value).length > 0;
  const isClearVisible = Boolean(onClear) && isFocused && hasValue && !action;

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className={cn('flex w-full flex-col gap-[6px]', wrapperClassName)}>
      <div
        className={cn(
          'flex h-[49px] w-full items-center gap-[10px] rounded-control border bg-white pl-[20px]',
          action ? 'pr-[12px]' : 'pr-[20px]',
          isError ? 'border-error' : isFocused ? 'border-gray-pc-200' : 'border-gray-pc-400',
        )}
      >
        <input
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isError || undefined}
          aria-describedby={hints?.length ? hintId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-16 font-medium text-gray-m-800 outline-none',
            'placeholder:text-gray-m-200',
            className,
          )}
          {...props}
        />

        {isClearVisible && (
          <button
            type="button"
            aria-label="입력 지우기"
            // 버튼을 눌러도 인풋 포커스가 풀리지 않도록
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="flex shrink-0 items-center justify-center"
          >
            <img src="/icons/input-clear.svg" alt="" className="block" />
          </button>
        )}

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex h-[30px] shrink-0 items-center justify-center rounded-chip bg-orange p-[10px] text-12 leading-[1.5] font-medium whitespace-nowrap text-white disabled:bg-gray-pc-300"
          >
            {action.label}
          </button>
        )}
      </div>

      {hints && hints.length > 0 && (
        <ul id={hintId} className="flex items-center gap-[14px]">
          {hints.map((hint) => (
            <li key={hint.label} className="flex items-center gap-[6px]">
              <img
                src={hint.isActive ? '/icons/check-active.svg' : '/icons/check-inactive.svg'}
                alt=""
                className="block"
              />
              <span className={cn('text-12 font-normal', hint.isActive ? 'text-orange' : 'text-gray-pc-300')}>
                {hint.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
