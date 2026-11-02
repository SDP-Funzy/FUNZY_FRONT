import type { ReactNode } from 'react';
import { FriendsPreviewProvider } from '@/components/friends/FriendsPreviewProvider';

export default function FriendsLayout({ children }: { children: ReactNode }) {
  return <FriendsPreviewProvider>{children}</FriendsPreviewProvider>;
}
