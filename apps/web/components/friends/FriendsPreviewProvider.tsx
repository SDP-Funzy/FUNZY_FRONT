'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { createPreviewFriends } from '@/lib/friendsPreview';

const useFriendsValue = () => {
  const [members, setMembers] = useState(createPreviewFriends);
  const [query, setQuery] = useState('');
  const requestFriend = (id: string) => setMembers(current => current.map(member => member.id === id && member.relation === 'none' ? { ...member, relation: 'sent' } : member));
  return { members, query, setQuery, requestFriend };
};
const FriendsContext = createContext<ReturnType<typeof useFriendsValue> | null>(null);
export const FriendsPreviewProvider = ({ children }: { children: ReactNode }) => {
  const value = useFriendsValue();
  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
};
export const useFriendsPreview = () => {
  const value = useContext(FriendsContext);
  if (!value) throw new Error('FriendsPreviewProvider가 필요합니다.');
  return value;
};
