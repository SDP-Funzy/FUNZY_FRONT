'use client';
import { createArchiveCommentsStore } from '@sdp/core';
import type { ArchiveComment } from '@sdp/core';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Popup } from '@/components/ui/Popup';
import { useOverlayRoot } from '@/hooks/common/useOverlayRoot';
import { archiveRepository } from '@/lib/archiveService';
import { letterFailure } from '@/lib/letterService';

type Mode = { kind: 'new' } | { kind: 'edit' | 'reply'; comment: ArchiveComment };
type CommentActions = { compose: (mode: Mode) => void; remove: (comment: ArchiveComment) => void; pending: boolean };
const useCommentPage = (cardId: number, rootId: number | null, revision: number) => {
  const [store] = useState(() => createArchiveCommentsStore(page => rootId === null ? archiveRepository.comments(cardId, page) : archiveRepository.replies(cardId, rootId, page)));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.load(); return store.cancel; }, [store, revision]);
  return { ...state, store };
};
const CommentRow = ({ item, actions }: { item: ArchiveComment; actions: CommentActions }) => <div className="flex gap-[10px] py-[12px]">
  <div className="min-w-0 flex-1"><p className="mb-[4px] text-12 font-semibold text-orange">{item.author.nickname}{item.mine ? ' · 나' : ''}</p><p className="text-14 leading-[1.55] break-words whitespace-pre-wrap">{item.content}</p><div className="flex flex-wrap gap-[12px] text-12 text-gray-m-300">
    <button type="button" disabled={actions.pending} onClick={() => actions.compose({ kind: 'reply', comment: item })} className="min-h-[36px]">답글 달기</button>
    {item.mine && <button type="button" disabled={actions.pending} aria-label={`댓글 ${item.commentId} 수정`} onClick={() => actions.compose({ kind: 'edit', comment: item })} className="min-h-[36px]">수정</button>}
    {item.deletable && <button type="button" disabled={actions.pending} aria-label={`댓글 ${item.commentId} 삭제`} onClick={() => actions.remove(item)} className="min-h-[36px] text-orange">삭제</button>}
    {item.edited && <span className="self-center">수정됨</span>}
  </div></div>
</div>;
const PageFeedback = ({ state }: { state: ReturnType<typeof useCommentPage> }) => <>
  {state.loading && <p role="status" className="py-[12px] text-12 text-gray-m-300">불러오는 중...</p>}
  {!!state.error && <div role="alert" className="py-[12px] text-12"><p>{letterFailure(state.error)}</p><button type="button" disabled={state.loading} onClick={() => void state.store.retry()} className="min-h-[36px] text-orange">다시 불러오기</button></div>}
  {!state.last && !state.error && <button type="button" disabled={state.loading} onClick={() => void state.store.more()} className="min-h-[36px] text-12 text-gray-m-300">더 보기</button>}
</>;
const Replies = ({ cardId, rootId, revision, actions }: { cardId: number; rootId: number; revision: number; actions: CommentActions }) => {
  const state = useCommentPage(cardId, rootId, revision);
  return <div className="ml-[24px] border-l border-gray-m-600 pl-[12px]">{state.items.map(item => <CommentRow key={item.commentId} item={item} actions={actions} />)}<PageFeedback state={state} /></div>;
};

export const ArchiveCommentsSheet = ({ cardId, onClose }: { cardId: number; onClose: () => void }) => {
  const [revision, setRevision] = useState(0);
  const state = useCommentPage(cardId, null, revision);
  const root = useOverlayRoot();
  const panel = useRef<HTMLDivElement>(null); const close = useRef<HTMLButtonElement>(null); const input = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(''); const [mode, setMode] = useState<Mode>({ kind: 'new' });
  const [expanded, setExpanded] = useState<number[]>([]);
  const [deleteItem, setDeleteItem] = useState<ArchiveComment | null>(null);
  const [pending, setPending] = useState(false); const busy = useRef(false);
  const [feedback, setFeedback] = useState(''); const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const main = root.parentElement?.querySelector('main'); const wasInert = main?.inert ?? false;
    const overflow = document.body.style.overflow; const mainOverflow = main?.style.overflow ?? '';
    if (main) { main.inert = true; main.style.overflow = 'hidden'; } document.body.style.overflow = 'hidden'; close.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      const dialogs = root.querySelectorAll('[role="dialog"]'); if (dialogs[dialogs.length - 1] !== panel.current) return;
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const elements = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), [href]') ?? [])].filter(element => element.getClientRects().length);
      const first = elements[0]; const last = elements[elements.length - 1]; if (!first) return;
      if (!panel.current?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; if (main) { main.inert = wasInert; main.style.overflow = mainOverflow; } if (previous?.isConnected) previous.focus(); };
  }, [root, onClose]);
  const compose = (next: Mode) => {
    if (busy.current) return;
    setMode(next); setDraft(next.kind === 'edit' ? next.comment.content : next.kind === 'reply' ? `@${next.comment.author.nickname} ` : ''); setError(null); setFeedback(''); requestAnimationFrame(() => input.current?.focus());
  };
  const submit = async () => {
    const text = draft.trim(); if (busy.current || !state.loaded || state.error || !text || text.length > 200) return;
    busy.current = true; setPending(true); setError(null);
    try {
      if (mode.kind === 'edit') await archiveRepository.updateComment(mode.comment.commentId, text);
      else await archiveRepository.createComment(cardId, text, mode.kind === 'reply' ? mode.comment.parentCommentId ?? mode.comment.commentId : undefined);
      if (!mounted.current) return;
      if (mode.kind === 'reply') { const id = mode.comment.parentCommentId ?? mode.comment.commentId; setExpanded(items => [...new Set([...items, id])]); }
      setFeedback(mode.kind === 'edit' ? '댓글을 수정했어요.' : '댓글을 남겼어요.'); setDraft(''); setMode({ kind: 'new' }); setRevision(value => value + 1);
    } catch (cause) { if (mounted.current) setError(letterFailure(cause)); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  const remove = async () => {
    if (!deleteItem || busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try { await archiveRepository.deleteComment(deleteItem.commentId); if (mounted.current) { if (mode.kind !== 'new' && (mode.comment.commentId === deleteItem.commentId || mode.comment.parentCommentId === deleteItem.commentId)) { setMode({ kind: 'new' }); setDraft(''); } setDeleteItem(null); setFeedback('댓글을 삭제했어요.'); setRevision(value => value + 1); } }
    catch (cause) { if (mounted.current) { setDeleteItem(null); setError(letterFailure(cause)); } }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  if (!root) return null;
  const unavailable = pending || !state.loaded || !!state.error;
  const actions = { compose, remove: setDeleteItem, pending: unavailable };
  return createPortal(<><div className="pointer-events-auto absolute inset-0 flex items-end bg-black/20" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-label="카드 댓글" className="flex max-h-[min(620px,85dvh)] min-h-[48dvh] w-full flex-col rounded-t-[24px] bg-gray-m-700 px-[20px] pb-[max(20px,env(safe-area-inset-bottom))] text-white shadow-lg">
      <button ref={close} type="button" aria-label="댓글 닫기" onClick={onClose} className="mx-auto flex h-[34px] w-[80px] shrink-0 items-center justify-center"><span className="h-[4px] w-[48px] rounded-full bg-gray-m-100" /></button><h2 className="pb-[8px] text-14 font-semibold">댓글</h2>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[18px]">
        {state.loaded && !state.error && !state.items.length && <p className="py-[36px] text-center text-14 text-gray-m-300">첫 댓글을 남겨보세요.</p>}
        {state.items.map(item => <div key={item.commentId}><CommentRow item={item} actions={actions} />{!!item.replyCount && <button type="button" aria-expanded={expanded.includes(item.commentId)} onClick={() => setExpanded(ids => ids.includes(item.commentId) ? ids.filter(id => id !== item.commentId) : [...ids, item.commentId])} className="min-h-[36px] px-[20px] text-12 text-gray-m-300">{expanded.includes(item.commentId) ? '답글 접기' : `답글 ${item.replyCount}개 더 보기`}</button>}{expanded.includes(item.commentId) && <Replies cardId={cardId} rootId={item.commentId} revision={revision} actions={actions} />}</div>)}
        <PageFeedback state={state} />
      </div>
      <form className="shrink-0 border-t border-gray-m-600 pt-[12px]" onSubmit={event => { event.preventDefault(); void submit(); }}>
        {mode.kind !== 'new' && <div className="mb-[8px] flex justify-between text-12 text-gray-m-100"><p>{mode.kind === 'edit' ? '내 댓글 수정 중' : `${mode.comment.author.nickname}님에게 답글 작성 중`}</p><button type="button" disabled={pending} onClick={() => compose({ kind: 'new' })} className="min-h-[32px] px-[8px]">취소</button></div>}
        <div className="flex items-end gap-[10px]"><label htmlFor="archive-comment-content" className="sr-only">{mode.kind === 'edit' ? '댓글 수정 내용' : mode.kind === 'reply' ? '답글 내용' : '댓글 내용'}</label><textarea id="archive-comment-content" ref={input} value={draft} maxLength={200} disabled={unavailable} rows={1} onChange={event => setDraft(event.target.value)} placeholder="카드에 댓글을 남겨보아요" className="max-h-[100px] min-h-[44px] min-w-0 flex-1 resize-y rounded-[20px] bg-gray-m-600 px-[14px] py-[12px] text-12 text-white placeholder:text-gray-m-300 focus:outline-2 focus:outline-orange" /><button type="submit" disabled={unavailable || !draft.trim()} className="min-h-[44px] px-[10px] text-14 font-semibold text-orange disabled:text-gray-m-400">{pending ? '처리 중...' : mode.kind === 'edit' ? '저장' : '등록'}</button></div>
        {error && <p role="alert" className="pt-[8px] text-12 text-orange">{error}</p>}<div className="mt-[6px] flex gap-[8px] text-12 text-gray-m-300"><p role="status" className="flex-1">{feedback}</p><span>{draft.length}/200</span></div>
      </form>
    </div>
  </div><Popup isOpen={deleteItem !== null} title="댓글을 삭제하시겠습니까?" description={deleteItem?.parentCommentId == null ? '원댓글을 삭제하면 답글도 함께 삭제됩니다.' : '삭제한 답글은 되돌릴 수 없어요.'} onCancel={() => { if (!busy.current) setDeleteItem(null); }} onConfirm={() => void remove()} /></>, root);
};
