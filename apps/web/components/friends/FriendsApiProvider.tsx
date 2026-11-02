'use client';
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
const FriendsApiContext = createContext<{ query: string; setQuery: (value: string) => void } | null>(null);
export const FriendsApiProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('');
  return <FriendsApiContext.Provider value={{ query, setQuery }}>{children}</FriendsApiContext.Provider>;
};
export const useFriendsApi = () => {
  const value = useContext(FriendsApiContext);
  if (!value) throw new Error('FriendsApiProvider가 필요합니다.');
  return value;
};
