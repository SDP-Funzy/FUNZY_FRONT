'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';

/**
 * 피그마 팝업 컴포넌트 대응 (예: 로그아웃 확인)
 * AppFrame 의 오버레이 영역에 뜨므로 PC 에서도 402px 프레임 안에서만 딤이 깔린다.
 */
type PopupProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const Popup = ({
  isOpen,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  onCancel,
  onConfirm,
}: PopupProps) => {
  const overlayRoot = useOverlayRoot();
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  // 부모가 매 렌더마다 새 함수를 넘겨도 effect 가 다시 돌지 않도록 최신 값만 ref 에 보관
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!isOpen) return;

    confirmRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !overlayRoot) return null;

  return createPortal(
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 px-page"
      onClick={onCancel}
    >
      <div
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
          <Button variant="muted" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} variant="primary" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    overlayRoot,
  );
};
