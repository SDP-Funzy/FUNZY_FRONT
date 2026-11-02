'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FriendAvatar } from '@/components/friends/FriendAvatar';
import { useFriendsPreview } from '@/components/friends/FriendsPreviewProvider';
import { normalizeFriendQuery, searchPreviewFriends } from '@/lib/friendsPreview';
import { ROUTES } from '@/lib/routes';

export const FriendSearchScreen = () => {
  const { members, query, setQuery } = useFriendsPreview();
  const results = searchPreviewFriends(members, query);
  return <div className="flex flex-1 flex-col bg-cream px-[24px] pt-[16px] pb-[32px]">
    <h1 className="sr-only">친구 찾기</h1>
    <Link href={ROUTES.home} aria-label="홈으로 돌아가기" className="w-fit rounded-control focus-visible:outline-2 focus-visible:outline-orange"><Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority /></Link>
    <form role="search" onSubmit={event => event.preventDefault()} className="mt-[32px] flex min-h-[48px] items-center gap-[10px] rounded-[12px] bg-white px-[16px] focus-within:outline-2 focus-within:outline-orange">
      <Image src="/icons/search.svg" alt="" width={18} height={18} />
      <label htmlFor="friend-search" className="sr-only">아이디로 친구 찾기</label>
      <input id="friend-search" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="아이디로 친구 찾기" autoComplete="off"
        className="min-h-[48px] min-w-0 flex-1 bg-transparent text-14 text-gray-m-600 outline-none placeholder:text-gray-m-400" />
    </form>
    <ul aria-label="친구 검색 결과" className="mt-[8px]">
      {results.map(member => <li key={member.id}><Link href={`${ROUTES.friends}/${member.id}`} aria-label={`@${member.loginId} 아카이브 보기`} className="flex min-h-[68px] items-center gap-[12px] rounded-control px-[8px] focus-visible:outline-2 focus-visible:outline-orange">
        <FriendAvatar src={member.avatar} /><span className="min-w-0 truncate text-14 text-gray-m-700">@{member.loginId}</span>
      </Link></li>)}
    </ul>
    {!!normalizeFriendQuery(query) && !results.length && <p role="status" className="py-[36px] text-center text-14 text-gray-m-400">검색 결과가 없어요.</p>}
  </div>;
};
