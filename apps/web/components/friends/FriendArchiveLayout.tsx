'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArchivePreviewProvider } from '@/components/archive/ArchivePreviewProvider';
import { FriendAvatar } from '@/components/friends/FriendAvatar';
import { useFriendsPreview } from '@/components/friends/FriendsPreviewProvider';
import { LetterboxPreviewProvider } from '@/components/letterbox/LetterboxPreviewProvider';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';

export const FriendArchiveLayout = ({ memberId, children }: { memberId: string; children: ReactNode }) => {
  const { members, requestFriend } = useFriendsPreview();
  const member = members.find(item => item.id === memberId);
  if (!member) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px]"><h1 className="text-18 font-semibold">회원을 찾을 수 없어요.</h1><Link href={ROUTES.friends} className="flex min-h-[44px] items-center text-14 underline">친구 검색으로 돌아가기</Link></div>;
  if (member.relation === 'friend') return <LetterboxPreviewProvider key={memberId}><ArchivePreviewProvider>{children}</ArchivePreviewProvider></LetterboxPreviewProvider>;
  const images = ['sample-shirt.jpg', 'sample-train.png', 'sample-night.png', 'sample-beach.png', 'sample-shirt.jpg', 'sample-night.png'];
  return <div className="relative isolate flex min-h-[560px] flex-1 flex-col bg-[#fafaf1]">
    <Header title={`${member.name}의 아카이브`} className="bg-[#fafaf1]" paddingClassName="px-[24px]" left={<Link href={ROUTES.friends} aria-label="친구 검색으로 돌아가기" className="rounded-full focus-visible:outline-2 focus-visible:outline-orange"><FriendAvatar src={member.avatar} size={40} /></Link>} />
    <p className="relative z-10 px-[24px] pt-[10px] text-12 text-gray-m-400">샘플 미리보기 · 실제 친구 요청은 전송되지 않아요.</p>
    <div aria-hidden="true" className="pointer-events-none relative min-h-[520px] flex-1 overflow-hidden">
      <div className="absolute inset-[-12px] blur-[8px]" style={{ backgroundImage: 'linear-gradient(to right,#e4e4db55 1px,transparent 1px),linear-gradient(to bottom,#e4e4db55 1px,transparent 1px)', backgroundSize: '28px 28px' }}>
        {images.map((image, index) => <div key={index} className="absolute size-[48px] overflow-hidden rounded-[12px] opacity-65" style={{ left: `${[4, 75, 52, 12, 67, 25][index]}%`, top: `${[12, 24, 41, 55, 70, 88][index]}%` }}><Image src={`/images/letterbox/${image}`} alt="" fill sizes="48px" className="object-cover" /></div>)}
      </div>
    </div>
    <div className="absolute inset-x-[24px] bottom-[max(40px,env(safe-area-inset-bottom))] z-10 flex justify-center">
      <Button fullWidth={false} disabled={member.relation === 'sent'} onClick={() => requestFriend(memberId)} className="w-[170px]">{member.relation === 'sent' ? '요청함' : '친구 요청'}</Button>
      <p role="status" className="sr-only">{member.relation === 'sent' ? '친구 요청을 보낸 미리보기 상태예요.' : '친구가 되면 아카이브를 볼 수 있어요.'}</p>
    </div>
  </div>;
};
