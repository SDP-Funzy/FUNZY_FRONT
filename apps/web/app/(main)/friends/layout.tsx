import type { ReactNode } from 'react';
import { FriendsApiProvider } from '@/components/friends/FriendsApiProvider';

export default function FriendsLayout({ children }: { children: ReactNode }) {
  return <FriendsApiProvider>{children}</FriendsApiProvider>;
}
