'use client';

import { useState } from 'react';
import { useArchivePreview } from '@/components/archive/ArchivePreviewProvider';
import { Popup } from '@/components/ui/Popup';
import { cn } from '@/lib/cn';

export const ArchiveEntryActions = ({ entryId, onRemoved }: { entryId: string; onRemoved: () => void }) => {
  const { entries, collections, removeEntry, setVisibility, toggleLike } = useArchivePreview();
  const entry = entries.find(item => item.id === entryId);
  const [confirm, setConfirm] = useState<'remove' | 'visibility' | null>(null);
  if (!entry) return null;
  const collection = collections.find(item => item.id === entry.collectionId);
  return <div className="mt-[14px] flex flex-wrap gap-[8px] rounded-funzy bg-white/90 p-[12px] text-12 text-black">
    <button type="button" aria-label="아카이브 카드 좋아요" aria-pressed={entry.liked} onClick={() => toggleLike(entryId)} className={cn('min-h-[44px] rounded-full border border-gray-m-100 px-[14px] font-semibold', entry.liked ? 'bg-orange text-white' : 'bg-white')}>좋아요 {entry.likeCount}</button>
    <button type="button" onClick={() => setConfirm('visibility')} className="min-h-[44px] rounded-full border border-gray-m-100 bg-white px-[14px]">공개 범위: {entry.visibility === 'friends' ? '친구 공개' : '나만 보기'}</button>
    <button type="button" onClick={() => setConfirm('remove')} className="min-h-[44px] w-full rounded-full bg-black px-[14px] text-white">아카이브에서 삭제</button>
    <Popup isOpen={confirm === 'remove'} title="아카이브에서 삭제하시겠습니까?" description={`“${collection?.title ?? ''}” 묶음에서만 삭제됩니다. 원본 편지와 댓글은 보관함에 남아요. 미리보기에서만 반영됩니다.`} onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); removeEntry(entryId); onRemoved(); }} />
    <Popup isOpen={confirm === 'visibility'} title={entry.visibility === 'friends' ? '나만 보기로 변경할까요?' : '친구 공개로 변경할까요?'} description="친구 공개 보드에서는 나만 보기 카드가 제외됩니다. 실제 공개 설정은 변경되지 않고 미리보기에서만 반영됩니다." onCancel={() => setConfirm(null)} onConfirm={() => { setVisibility(entryId, entry.visibility === 'friends' ? 'private' : 'friends'); setConfirm(null); }} />
  </div>;
};
