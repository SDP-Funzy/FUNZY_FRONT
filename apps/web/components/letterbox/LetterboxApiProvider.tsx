'use client';

import { createReceivedLettersStore } from '@sdp/core';
import { createContext, useContext, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { letterRepository } from '@/lib/letterService';

const useLetterboxValue = () => {
  const [tab, setTab] = useState<'all' | 'hidden'>('all');
  const [store] = useState(() => createReceivedLettersStore(letterRepository));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<string | null>(null);
  return { store, state, tab, setTab, query, setQuery, date, setDate };
};
const LetterboxApiContext = createContext<ReturnType<typeof useLetterboxValue> | null>(null);
export const LetterboxApiProvider = ({ children }: { children: ReactNode }) => {
  const value = useLetterboxValue(); return <LetterboxApiContext.Provider value={value}>{children}</LetterboxApiContext.Provider>;
};
export const useLetterboxApi = () => {
  const value = useContext(LetterboxApiContext); if (!value) throw new Error('LetterboxApiProvider가 필요합니다.'); return value;
};
