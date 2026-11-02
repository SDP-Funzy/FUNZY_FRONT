import type { ReactNode } from 'react';
import { FriendArchiveLayout } from '@/components/friends/FriendArchiveLayout';

export default async function MemberArchiveLayout({ children, params }: { children: ReactNode; params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return <FriendArchiveLayout key={memberId} memberId={memberId}>{children}</FriendArchiveLayout>;
}
