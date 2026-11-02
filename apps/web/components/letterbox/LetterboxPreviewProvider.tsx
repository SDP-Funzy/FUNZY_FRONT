'use client';

import { createContext, useContext, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPreviewComments, createPreviewLetters } from '@/lib/letterboxPreview';
import type { LetterboxTab, PreviewComment } from '@/lib/letterboxPreview';

const usePreviewValue = () => {
  const [letters, setLetters] = useState(createPreviewLetters);
  const [tab, setTab] = useState<LetterboxTab>('all');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [comments, setComments] = useState(createPreviewComments);
  const commentPrefix = useId();
  const commentSequence = useRef(0);
  const toggleFavorite = (id: string) => setLetters(current => current.map(letter => letter.id === id ? { ...letter, favorite: !letter.favorite } : letter));
  const unhide = (id: string) => setLetters(current => current.map(letter => letter.id === id ? { ...letter, hidden: false } : letter));
  const hide = (id: string) => setLetters(current => current.map(letter => letter.id === id ? { ...letter, hidden: true } : letter));
  const addComment = (letterId: string, body: string, parentId: string | null) => {
    const text = body.trim();
    if (!text || text.length > 300) return;
    const comment: PreviewComment = { id: `${commentPrefix}-${++commentSequence.current}`, parentId, author: 'FunFun', body: text, mine: true, favorite: false };
    setComments(current => {
      const existing = current[letterId] ?? [];
      if (parentId && !existing.some(item => item.id === parentId && !item.parentId && !item.deleted)) return current;
      return { ...current, [letterId]: [...existing, comment] };
    });
  };
  const editComment = (letterId: string, id: string, body: string) => {
    const text = body.trim();
    if (!text || text.length > 300) return;
    setComments(current => ({ ...current, [letterId]: (current[letterId] ?? []).map(item => item.id === id && item.mine && !item.deleted ? { ...item, body: text } : item) }));
  };
  const deleteComment = (letterId: string, id: string) => setComments(current => ({ ...current,
    [letterId]: (current[letterId] ?? []).map(item => item.id === id && item.mine ? { ...item, body: '', deleted: true, favorite: false } : item),
  }));
  const toggleCommentFavorite = (letterId: string, id: string) => setComments(current => ({ ...current,
    [letterId]: (current[letterId] ?? []).map(item => item.id === id && !item.deleted ? { ...item, favorite: !item.favorite } : item),
  }));
  return { letters, tab, setTab, query, setQuery, date, setDate, toggleFavorite, unhide, hide,
    comments, addComment, editComment, deleteComment, toggleCommentFavorite };
};
const PreviewContext = createContext<ReturnType<typeof usePreviewValue> | null>(null);
export const LetterboxPreviewProvider = ({ children }: { children: ReactNode }) => {
  const value = usePreviewValue();
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};
export const useLetterboxPreview = () => {
  const value = useContext(PreviewContext);
  if (!value) throw new Error('LetterboxPreviewProvider가 필요합니다.');
  return value;
};
