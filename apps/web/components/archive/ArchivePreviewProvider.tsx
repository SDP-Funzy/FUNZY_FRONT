'use client';

import { createContext, useContext, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { ARCHIVE_COLORS, createArchivePreview } from '@/lib/archivePreview';
import type { ArchiveScope, ArchiveVisibility } from '@/lib/archivePreview';

const useArchiveValue = () => {
  const { letters } = useLetterboxPreview();
  const [state, setState] = useState(createArchivePreview);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scope, setScope] = useState<ArchiveScope>('friends');
  const [zoom, setZoom] = useState(1);
  const prefix = useId();
  const sequence = useRef(0);
  const visibleEntries = state.entries.filter(entry => (scope === 'all' || entry.visibility === scope) && letters.some(letter => letter.id === entry.letterId && !letter.hidden));
  const addCategory = (name: string) => {
    const text = name.trim();
    if (text.length < 2 || text.length > 20 || state.categories.some(category => category.name.toLocaleLowerCase() === text.toLocaleLowerCase())) return null;
    const id = `${prefix}-category-${++sequence.current}`;
    setState(current => ({ ...current, categories: [...current.categories, { id, name: text, color: ARCHIVE_COLORS[current.categories.length % ARCHIVE_COLORS.length] }],
      collections: [...current.collections, { id: `${id}-collection`, categoryId: id, title: text }] }));
    return id;
  };
  const addEntries = (targetCategory: string, letterIds: string[]) => {
    const collection = state.collections.find(item => item.categoryId === targetCategory);
    if (!collection) return;
    const ids = [...new Set(letterIds)].filter(id => letters.some(letter => letter.id === id && !letter.hidden) && !state.entries.some(entry => entry.collectionId === collection.id && entry.letterId === id));
    const additions = ids.map(letterId => ({ id: `${prefix}-entry-${++sequence.current}`, collectionId: collection.id, letterId, visibility: 'friends' as const, liked: false, likeCount: 0 }));
    setState(current => ({ ...current, entries: [...current.entries, ...additions] }));
  };
  const removeEntry = (id: string) => setState(current => ({ ...current, entries: current.entries.filter(entry => entry.id !== id) }));
  const setVisibility = (id: string, visibility: ArchiveVisibility) => setState(current => ({ ...current, entries: current.entries.map(entry => entry.id === id ? { ...entry, visibility } : entry) }));
  const toggleLike = (id: string) => setState(current => ({ ...current, entries: current.entries.map(entry => entry.id === id ? { ...entry, liked: !entry.liked, likeCount: Math.max(0, entry.likeCount + (entry.liked ? -1 : 1)) } : entry) }));
  return { ...state, letters, categoryId, setCategoryId, scope, setScope, zoom, setZoom, visibleEntries, addCategory, addEntries, removeEntry, setVisibility, toggleLike };
};
const ArchiveContext = createContext<ReturnType<typeof useArchiveValue> | null>(null);
export const ArchivePreviewProvider = ({ children }: { children: ReactNode }) => {
  const value = useArchiveValue();
  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
};
export const useArchivePreview = () => {
  const value = useContext(ArchiveContext);
  if (!value) throw new Error('ArchivePreviewProvider가 필요합니다.');
  return value;
};
