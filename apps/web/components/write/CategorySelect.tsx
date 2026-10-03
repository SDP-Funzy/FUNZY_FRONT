'use client';

import { HEART_CARD_CATEGORIES } from '@sdp/core';
import type { HeartCardCategory } from '@sdp/core';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { CATEGORY_LABELS } from '@/components/write/categoryLabels';
import { cn } from '@/lib/cn';

type CategorySelectProps = {
  value: HeartCardCategory;
  customValue: string;
  onChange: (category: HeartCardCategory) => void;
  onCustomChange: (value: string) => void;
};

const CUSTOM_CATEGORY_MAX_LENGTH = 10;
const LAST_INDEX = HEART_CARD_CATEGORIES.length - 1;

/**
 * 마음카드 카테고리 선택 (Figma 카테고리 목록)
 * "카테고리 : 음악" 을 누르면 목록이 열리고, '기타 직접입력' 을 고르면 이름을 직접 적는 칸이 생긴다.
 *
 * 키보드 조작 (WAI-ARIA listbox 패턴)
 * - 버튼에서 Enter / Space / ↓ / ↑ : 목록 열기 (지금 선택된 항목에 포커스)
 * - 목록에서 ↑ ↓ Home End : 항목 이동, Enter / Space : 선택, Esc : 닫기
 * - 닫히면 포커스는 다시 버튼으로 돌아간다
 */
export const CategorySelect = ({ value, customValue, onChange, onCustomChange }: CategorySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => HEART_CARD_CATEGORIES.indexOf(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();

  const open = () => {
    setActiveIndex(HEART_CARD_CATEGORIES.indexOf(value));
    setIsOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const select = (category: HeartCardCategory) => {
    onChange(category);
    close(true);
  };

  // 목록이 열리거나 이동하면 그 항목에 포커스
  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  // 목록 밖을 누르면 닫기 (포커스는 누른 곳으로 가도록 버튼으로 돌리지 않는다)
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open();
    }
  };

  const handleListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, LAST_INDEX));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(LAST_INDEX);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(HEART_CARD_CATEGORIES[activeIndex]!);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        // Tab 으로 빠져나가면 목록만 닫고 포커스는 다음 요소로 자연스럽게 이동
        close(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center text-12 leading-[1.55] font-normal text-gray-m-400">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => (isOpen ? close(true) : open())}
        onKeyDown={handleTriggerKeyDown}
        className="whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
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
          onKeyDown={handleListKeyDown}
          className="absolute top-[calc(100%+8px)] -left-[8px] z-20 w-[108px] overflow-hidden rounded-[12px] bg-white py-px shadow-[0_4px_8px_0_rgba(0,0,0,0.15)]"
        >
          {HEART_CARD_CATEGORIES.map((category, index) => {
            const isSelected = category === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={category}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(category)}
                onPointerMove={() => setActiveIndex(index)}
                className={cn(
                  'flex h-[30px] w-full cursor-pointer items-center pl-[15px] text-14 leading-[1.8] font-medium outline-none',
                  // 피그마: 선택(가리킨) 항목은 주황 배경 + 흰 글자
                  isActive ? 'bg-orange text-white' : 'text-gray-m-200',
                )}
              >
                {CATEGORY_LABELS[category]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};