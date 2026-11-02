'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { Popup } from '@/components/ui/Popup';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';
import type { PreviewComment } from '@/lib/letterboxPreview';
import { cn } from '@/lib/cn';

type ComposeMode = { kind: 'new' } | { kind: 'reply' | 'edit'; id: string; author: string };

export const LetterCommentsSheet = ({ letterId, onClose }: { letterId: string; onClose: () => void }) => {
  const { comments, addComment, editComment, deleteComment, toggleCommentFavorite } = useLetterboxPreview();
  const items = comments[letterId] ?? [];
  const overlayRoot = useOverlayRoot();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposeMode>({ kind: 'new' });
  const [expanded, setExpanded] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!overlayRoot) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const main = overlayRoot.parentElement?.querySelector('main');
    const oldInert = main?.inert ?? false;
    const oldOverflow = document.body.style.overflow;
    const oldMainOverflow = main?.style.overflow ?? '';
    if (main) { main.inert = true; main.style.overflow = 'hidden'; }
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      const dialogs = overlayRoot.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== panel.current) return;
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, [href], [tabindex="0"]') ?? [])].filter(element => element.getClientRects().length);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (!first) return;
      if (!panel.current?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = oldOverflow;
      if (main) { main.inert = oldInert; main.style.overflow = oldMainOverflow; }
      previous?.focus();
    };
  }, [overlayRoot, onClose]);

  const compose = (next: ComposeMode, text = '') => { setMode(next); setDraft(text); setMenu(null); setFeedback(''); requestAnimationFrame(() => input.current?.focus()); };
  const submit = () => {
    const text = draft.trim();
    if (!text || text.length > 300) return;
    if (mode.kind === 'edit') editComment(letterId, mode.id, text);
    else {
      addComment(letterId, text, mode.kind === 'reply' ? mode.id : null);
      if (mode.kind === 'reply') setExpanded(current => [...new Set([...current, mode.id])]);
    }
    setFeedback(mode.kind === 'edit' ? '댓글을 수정했어요.' : '댓글을 남겼어요.');
    setDraft(''); setMode({ kind: 'new' });
    requestAnimationFrame(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); input.current?.focus(); });
  };
  const renderComment = (comment: PreviewComment, reply = false) => <div key={comment.id} className={cn('flex gap-[10px] py-[12px]', reply && 'ml-[24px] border-l border-gray-m-600 pl-[12px]')}>
    <div className="min-w-0 flex-1">
      {comment.deleted ? <p className="text-12 text-gray-m-300">삭제된 댓글입니다.</p> : <>
        <p className="mb-[4px] text-12 font-semibold text-orange">{comment.author}{comment.mine ? ' · 나' : ''}</p>
        <p className="text-14 leading-[1.55] break-words whitespace-pre-wrap text-white">{comment.body}</p>
        {!reply && <button type="button" className="min-h-[32px] pr-[12px] text-12 text-gray-m-300" onClick={() => compose({ kind: 'reply', id: comment.id, author: comment.author })}>답글 달기</button>}
      </>}
    </div>
    {!comment.deleted && <div className="relative flex shrink-0 items-start" onKeyDown={event => { if (event.key === 'Escape' && menu === comment.id) { event.stopPropagation(); setMenu(null); } }}>
      <button type="button" aria-label={`${comment.author}의 ${comment.id} 댓글 즐겨찾기`} aria-pressed={comment.favorite}
        onClick={() => toggleCommentFavorite(letterId, comment.id)} className="flex size-[36px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
        <Image src={comment.favorite ? '/icons/favorite-active.svg' : '/icons/favorite-inactive.svg'} alt="" width={18} height={18} />
      </button>
      {comment.mine && <>
        <button type="button" aria-label={`${comment.id} 내 댓글 메뉴`} aria-expanded={menu === comment.id} onClick={() => setMenu(current => current === comment.id ? null : comment.id)}
          className="flex h-[36px] w-[28px] items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange">
          <Image src="/icons/more-vertical.svg" alt="" width={3} height={13} />
        </button>
        {menu === comment.id && <div className="absolute top-[38px] right-0 z-10 flex rounded-control bg-white px-[4px] text-12 text-black shadow-lg">
          <button type="button" onClick={() => compose({ kind: 'edit', id: comment.id, author: comment.author }, comment.body)} className="min-h-[44px] min-w-[52px] rounded-control focus-visible:outline-2 focus-visible:outline-orange">수정</button>
          <button type="button" onClick={() => { setMenu(null); setDeleteId(comment.id); }} className="min-h-[44px] min-w-[52px] rounded-control text-error focus-visible:outline-2 focus-visible:outline-orange">삭제</button>
        </div>}
      </>}
    </div>}
  </div>;

  if (!overlayRoot) return null;
  return createPortal(<>
    <div className="pointer-events-auto absolute inset-0 flex items-end bg-black/20" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="카드 댓글" className="flex max-h-[min(620px,85dvh)] min-h-[48dvh] w-full flex-col rounded-t-[24px] bg-gray-m-700 px-[20px] pb-[max(20px,env(safe-area-inset-bottom))] text-white shadow-lg">
        <button ref={close} type="button" aria-label="댓글 닫기" onClick={onClose} className="mx-auto flex h-[34px] w-[80px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><span className="h-[4px] w-[48px] rounded-full bg-gray-m-100" /></button>
        <div className="flex shrink-0 items-center justify-between pb-[8px]">
          <h2 className="text-14 font-semibold">댓글 {items.filter(item => !item.deleted).length}</h2>
        </div>
        <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[18px]">
          {!items.length && <p className="py-[36px] text-center text-14 text-gray-m-300">첫 댓글을 남겨보세요.</p>}
          {items.filter(item => !item.parentId).map(comment => {
            const replies = items.filter(item => item.parentId === comment.id);
            const open = expanded.includes(comment.id);
            return <div key={comment.id}>
              {renderComment(comment)}
              {!!replies.length && <button type="button" aria-expanded={open} onClick={() => setExpanded(current => open ? current.filter(id => id !== comment.id) : [...current, comment.id])}
                className="mb-[4px] min-h-[36px] px-[20px] text-12 text-gray-m-300">{open ? '답글 접기' : `답글 ${replies.filter(item => !item.deleted).length}개 더 보기`}</button>}
              {open && replies.map(reply => renderComment(reply, true))}
            </div>;
          })}
        </div>
        <form className="shrink-0 border-t border-gray-m-600 pt-[12px]" onSubmit={event => { event.preventDefault(); submit(); }}>
          {mode.kind !== 'new' && <div className="mb-[8px] flex items-center justify-between gap-[8px] text-12 text-gray-m-100">
            <p>{mode.kind === 'edit' ? '내 댓글 수정 중' : `${mode.author}님에게 답글 작성 중`}</p>
            <button type="button" className="min-h-[32px] px-[8px]" onClick={() => compose({ kind: 'new' })}>취소</button>
          </div>}
          <div className="flex items-end gap-[10px]">
            <Image src="/images/letterbox/sample-avatar.jpg" alt="내 프로필" width={36} height={36} className="mb-[4px] size-[36px] shrink-0 rounded-full object-cover" />
            <label htmlFor="letter-comment-body" className="sr-only">{mode.kind === 'edit' ? '댓글 수정 내용' : mode.kind === 'reply' ? '답글 내용' : '댓글 내용'}</label>
            <textarea ref={input} id="letter-comment-body" value={draft} maxLength={300} rows={1} onChange={event => setDraft(event.target.value)} placeholder="카드에 댓글을 남겨보아요"
              className="max-h-[100px] min-h-[44px] min-w-0 flex-1 resize-y rounded-[20px] bg-gray-m-600 px-[14px] py-[12px] text-12 text-white placeholder:text-gray-m-300 focus:outline-2 focus:outline-orange" />
            <button type="submit" disabled={!draft.trim()} className="min-h-[44px] shrink-0 rounded-control px-[10px] text-14 font-semibold text-orange focus-visible:outline-2 focus-visible:outline-orange disabled:text-gray-m-400">{mode.kind === 'edit' ? '저장' : '등록'}</button>
          </div>
          <div className="mt-[6px] flex gap-[8px] text-12 text-gray-m-300"><p role="status" className="min-w-0 flex-1">{feedback}</p><span>{draft.length}/300</span></div>
        </form>
      </div>
    </div>
    <Popup isOpen={deleteId !== null} title="댓글을 삭제하시겠습니까?" description="삭제된 댓글 안내는 남고, 기존 답글은 유지됩니다." onCancel={() => { setDeleteId(null); requestAnimationFrame(() => input.current?.focus()); }} onConfirm={() => {
      if (deleteId) { deleteComment(letterId, deleteId); if (mode.kind !== 'new' && mode.id === deleteId) compose({ kind: 'new' }); }
      setDeleteId(null); setFeedback('댓글을 삭제했어요.');
      requestAnimationFrame(() => input.current?.focus());
    }} />
  </>, overlayRoot);
};
