'use client';

import { HEART_CARD_CATEGORIES } from '@sdp/core';
import type { HeartCardCategory } from '@sdp/core';
import { useEffect, useId, useRef, useState } from 'react';

import { CATEGORY_LABELS } from '@/components/write/categoryLabels';
import { cn } from '@/lib/cn';

type CategorySelectProps = {
  value: HeartCardCategory;
  customValue: string;
  onChange: (category: HeartCardCategory) => void;
  onCustomChange: (value: string) => void;
};

const CUSTOM_CATEGORY_MAX_LENGTH = 10;

/**
 * 마음카드 카테고리 선택 (Figma 카테고리 목록)
 * "카테고리 : 음악" 을 누르면 목록이 열리고, '기타 직접입력' 을 고르면 이름을 직접 적는 칸이 생긴다.
 */
export const CategorySelect = ({ value, customValue, onChange, onCustomChange }: CategorySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // 목록 밖을 누르거나 ESC 를 누르면 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (category: HeartCardCategory) => {
    onChange(category);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center text-12 leading-[1.55] font-normal text-gray-m-400">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="whitespace-nowrap"
      >
        카테고리 : {value === 'ETC' ? '기타' : CATEGORY_LABELS[value]}
      </button>

      {value === 'ETC' && (
        <input
          aria-label="카테고리 직접 입력"
          placeholder="직접 입력"
          maxLength={CUSTOM_CATEGORY_MAX_LENGTH}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          className="ml-[4px] w-[90px] border-b border-gray-m-100 bg-transparent text-gray-m-800 outline-none placeholder:text-gray-m-200 focus:border-gray-m-400"
        />
      )}

      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          aria-label="카테고리"
          className="absolute top-[calc(100%+8px)] -left-[8px] z-20 w-[108px] overflow-hidden rounded-[12px] bg-white py-px shadow-[0_4px_8px_0_rgba(0,0,0,0.15)]"
        >
          {HEART_CARD_CATEGORIES.map((category) => {
            const isSelected = category === value;
            return (
              <li key={category} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={cn(
                    'flex h-[30px] w-full items-center pl-[15px] text-14 leading-[1.8] font-medium',
                    isSelected ? 'bg-orange text-white' : 'text-gray-m-200 hover:text-gray-m-500',
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
