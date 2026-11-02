'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { createPreviewLetters } from '@/lib/letterboxPreview';
import type { LetterboxTab } from '@/lib/letterboxPreview';

const usePreviewValue = () => {
  const [letters, setLetters] = useState(createPreviewLetters);
  const [tab, setTab] = useState<LetterboxTab>('all');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const toggleFavorite = (id: string) => setLetters(current => current.map(letter => letter.id === id ? { ...letter, favorite: !letter.favorite } : letter));
  const unhide = (id: string) => setLetters(current => current.map(letter => letter.id === id ? { ...letter, hidden: false } : letter));
  return { letters, tab, setTab, query, setQuery, date, setDate, toggleFavorite, unhide };
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
