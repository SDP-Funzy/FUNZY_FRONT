'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { PolicyDocument } from '@/components/legal/PolicyDocument';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';

export type SignupConsents = { terms: boolean; privacy: boolean; age14: boolean };
type Props = {
  open: boolean;
  pending: boolean;
  value: SignupConsents;
  error: string | null;
  onChange: (value: SignupConsents) => void;
  onClose: () => void;
  onSubmit: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const ITEMS = [
  { key: 'terms', label: '이용약관 동의 (필수)', document: 'terms' },
  { key: 'privacy', label: '개인정보 수집 및 이용 동의 (필수)', document: 'privacy' },
  { key: 'age14', label: '만 14세 이상입니다 (필수)' },
] as const;

export const SignupTermsSheet = ({ open, pending, value, error, onChange, onClose, onSubmit, returnFocusRef }: Props) => {
  const root = useOverlayRoot();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ onClose, pending });
  const [expanded, setExpanded] = useState<string | null>(null);
  const all = value.terms && value.privacy && value.age14;

  useEffect(() => { latest.current = { onClose, pending }; });
  useEffect(() => {
    if (!open || !root) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocus = returnFocusRef.current ?? previousFocus;
    const main = root.parentElement?.querySelector('main');
    const previousInert = main?.inert ?? false;
    const overflow = document.body.style.overflow;
    if (main) main.inert = true;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !latest.current.pending) latest.current.onClose();
      if (event.key !== 'Tab') return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex="0"]');
      if (!items?.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      if (main) main.inert = previousInert;
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKey);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open, root, returnFocusRef]);

  if (!open || !root) return null;
  const checkbox = (label: string, checked: boolean, change: (checked: boolean) => void) => (
    <label className="flex cursor-pointer items-center gap-[12px] text-15 text-black">
      <span className="relative flex h-[24px] w-[24px] shrink-0 items-center justify-center">
        <input type="checkbox" aria-label={label} checked={checked} disabled={pending} onChange={(event) => change(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full bg-gray-m-50 checked:bg-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange" />
        <span aria-hidden="true" className="pointer-events-none relative text-16 text-gray-m-200 peer-checked:text-white">✓</span>
      </span>
      {label}
    </label>
  );

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 flex items-end bg-black/20" onClick={() => { if (!pending) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[24px] bg-white px-[28px] pt-[32px] pb-[calc(24px+env(safe-area-inset-bottom,0px))] outline-none">
        <div className="mb-[24px] flex items-start justify-between gap-[12px]">
          <h2 id={titleId} className="text-18 leading-[1.5] font-bold">FUNZY 이용을 위해 약관 동의가 필요해요</h2>
          <button type="button" disabled={pending} onClick={onClose} aria-label="약관 동의 닫기" className="p-[4px] text-18">×</button>
        </div>
        {checkbox('전체 동의합니다', all, (checked) => onChange({ terms: checked, privacy: checked, age14: checked }))}
        <p className="mt-[12px] mb-[24px] text-12 leading-[1.6] text-gray-m-500">각 항목의 내용을 확인하고 동의해 주세요.</p>
        <div className="flex flex-col gap-[16px] border-t border-gray-m-100 pt-[24px]">
          {ITEMS.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-[8px]">
                {checkbox(item.label, value[item.key], (checked) => onChange({ ...value, [item.key]: checked }))}
                {'document' in item && <button type="button" disabled={pending} aria-expanded={expanded === item.key}
                  aria-label={`${item.label} 내용 보기`} onClick={() => setExpanded(expanded === item.key ? null : item.key)} className="shrink-0 p-[4px] text-12 underline">보기</button>}
              </div>
              {'document' in item && expanded === item.key && <div role="region" aria-label={`${item.label} 본문`} tabIndex={0} className="mt-[12px] max-h-[40dvh] overflow-y-auto overscroll-contain rounded-control bg-gray-pc-100 p-[12px] focus-visible:outline-2 focus-visible:outline-orange"><PolicyDocument kind={item.document} /></div>}
            </div>
          ))}
        </div>
        {error && <p role="alert" className="mt-[16px] text-12 text-error">{error}</p>}
        <Button variant="accent" className="mt-[28px]" disabled={!all || pending} onClick={onSubmit}>{pending ? '가입 중...' : '회원 가입하기'}</Button>
      </div>
    </div>, root,
  );
};
