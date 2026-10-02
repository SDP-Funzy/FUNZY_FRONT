'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';

/**
 * 피그마 팝업 컴포넌트 대응 (예: 로그아웃 확인)
 * showCancel={false} 로 확인 버튼 하나짜리 안내 팝업으로도 쓴다.
 * AppFrame 의 오버레이 영역에 뜨므로 PC 에서도 402px 프레임 안에서만 딤이 깔린다.
 */
type PopupProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  /** false 면 취소 버튼을 숨기고 확인 버튼 하나만 보여준다 (안내용 팝업). 기본 true */
  showCancel?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const Popup = ({
  isOpen,
  title,
  description,
  cancelLabel = '취소',
  showCancel = true,
  confirmLabel = '확인',
  onCancel,
  onConfirm,
}: PopupProps) => {
  const overlayRoot = useOverlayRoot();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // 부모가 매 렌더마다 새 함수를 넘겨도 effect 가 다시 돌지 않도록 최신 값만 ref 에 보관
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    // 오버레이 영역이 준비돼서 확인 버튼이 실제로 그려진 뒤에 실행
    if (!isOpen || !overlayRoot) return;

    // 팝업을 연 요소를 기억했다가 닫힐 때 포커스를 돌려준다
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      // Tab / Shift+Tab 포커스가 팝업 밖으로 나가지 않도록 처음과 끝을 이어준다
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!dialogRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, overlayRoot]);

  if (!isOpen || !overlayRoot) return null;

  return createPortal(
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 px-page"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[340px] flex-col gap-[29px] rounded-popup bg-white p-[22px]"
      >
        <div className="flex flex-col gap-[16px]">
          <p id={titleId} className="text-16 font-semibold text-black">
            {title}
          </p>
          {description && <p className="text-14 font-medium text-gray-pc-500">{description}</p>}
        </div>

        <div className="flex items-center gap-[8px]">
          {showCancel && (
            <Button variant="muted" onClick={onCancel} className="flex-1">
              {cancelLabel}
            </Button>
          )}
          <Button ref={confirmRef} variant="primary" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    overlayRoot,
  );
};
