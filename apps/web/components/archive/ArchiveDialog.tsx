'use client';

import Image from 'next/image';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';

export const ArchiveDialog = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => {
  const root = useOverlayRoot();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const main = root.parentElement?.querySelector('main');
    const oldInert = main?.inert ?? false;
    const oldOverflow = document.body.style.overflow;
    const oldMainOverflow = main?.style.overflow ?? '';
    if (main) { main.inert = true; main.style.overflow = 'hidden'; }
    document.body.style.overflow = 'hidden'; close.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, [href]') ?? [])].filter(element => element.getClientRects().length);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (!first) return;
      if (!panel.current?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown); document.body.style.overflow = oldOverflow;
      if (main) { main.inert = oldInert; main.style.overflow = oldMainOverflow; }
      if (previous?.isConnected) previous.focus();
      else main?.querySelector<HTMLElement>('button:not([disabled]), [href], input, select')?.focus();
    };
  }, [root]);
  if (!root) return null;
  return createPortal(<div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 px-[24px]" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[85dvh] w-full max-w-[354px] overflow-y-auto rounded-popup bg-white p-[20px]">
      <div className="mb-[16px] flex items-center justify-between gap-[12px]"><h2 id={titleId} className="text-18 font-semibold">{title}</h2>
        <button ref={close} type="button" onClick={onClose} aria-label={`${title} 닫기`} className="flex size-[44px] items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={20} height={20} /></button>
      </div>{children}
    </div>
  </div>, root);
};
