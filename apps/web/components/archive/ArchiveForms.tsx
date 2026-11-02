'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArchiveDialog } from '@/components/archive/ArchiveDialog';
import { useArchivePreview } from '@/components/archive/ArchivePreviewProvider';
import { Button } from '@/components/ui/Button';

export const ArchiveCategoryForm = ({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) => {
  const { categories, addCategory } = useArchivePreview();
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const duplicate = categories.some(category => category.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  const valid = trimmed.length >= 2 && trimmed.length <= 20 && !duplicate;
  return <ArchiveDialog title="카테고리 추가" onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); if (!valid) return; const id = addCategory(trimmed); if (id) onCreated(id); }}>
      <label htmlFor="archive-category-name" className="mb-[8px] block text-14">카테고리 이름</label>
      <input id="archive-category-name" value={name} maxLength={20} onChange={event => setName(event.target.value)} placeholder="2~20자로 입력해 주세요" aria-invalid={duplicate || (!!name && !valid)} aria-describedby="archive-category-help"
        className="min-h-[47px] w-full rounded-control border border-gray-m-200 px-[12px] text-14 focus:outline-2 focus:outline-orange" />
      <p id="archive-category-help" className="mt-[8px] text-12 text-gray-m-400">{duplicate ? '이미 있는 카테고리 이름이에요.' : '앞뒤 공백을 제외한 2~20자, 중복 불가'}</p>
      <p className="my-[20px] text-12 text-gray-m-400">미리보기에서만 추가되며 서버에는 저장되지 않아요.</p>
      <Button disabled={!valid} type="submit">추가</Button>
    </form>
  </ArchiveDialog>;
};

export const ArchiveAddCardsForm = ({ initialCategory, onClose, onAdded }: { initialCategory: string | null; onClose: () => void; onAdded: (id: string) => void }) => {
  const { categories, collections, entries, letters, addEntries } = useArchivePreview();
  const [categoryId, setCategoryId] = useState(initialCategory ?? categories[0].id);
  const [picked, setPicked] = useState<string[]>([]);
  const collection = collections.find(item => item.categoryId === categoryId);
  const available = letters.filter(letter => !letter.hidden && !entries.some(entry => entry.collectionId === collection?.id && entry.letterId === letter.id));
  return <ArchiveDialog title="카드 담기" onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); if (!picked.length) return; addEntries(categoryId, picked); onAdded(categoryId); }}>
      <label htmlFor="archive-card-category" className="mb-[8px] block text-14">담을 카테고리</label>
      <select id="archive-card-category" value={categoryId} onChange={event => { setCategoryId(event.target.value); setPicked([]); }} className="mb-[16px] min-h-[44px] w-full rounded-control border border-gray-m-200 px-[10px] text-14">
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <div className="max-h-[38dvh] overflow-y-auto overscroll-contain">
        {available.map(letter => <label key={letter.id} className="flex min-h-[64px] items-center gap-[12px] border-b border-gray-m-50 py-[8px]">
          <input type="checkbox" checked={picked.includes(letter.id)} aria-label={`${letter.sender}의 편지 ${letter.id} 담기`} onChange={event => setPicked(current => event.target.checked ? [...current, letter.id] : current.filter(id => id !== letter.id))} className="size-[18px] shrink-0 accent-orange" />
          <Image src={letter.image} alt="" width={44} height={44} className="size-[44px] rounded-control object-cover" />
          <span className="min-w-0 text-14"><span className="block truncate font-medium">{letter.sender}</span><span className="text-12 text-gray-m-400">{letter.date}</span></span>
        </label>)}
        {!available.length && <p className="py-[24px] text-center text-14 text-gray-m-400">담을 수 있는 편지를 모두 담았어요.</p>}
      </div>
      <p className="my-[16px] text-12 text-gray-m-400">선택한 카드는 친구 공개로 추가돼요. 미리보기에서만 유지됩니다.</p>
      <Button type="submit" disabled={!picked.length}>{picked.length}개 담기</Button>
    </form>
  </ArchiveDialog>;
};
