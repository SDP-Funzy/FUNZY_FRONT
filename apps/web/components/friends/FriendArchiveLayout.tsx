'use client';
import { createFriendRequest } from '@sdp/core';
import type { FriendMember } from '@sdp/core';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArchiveApiProvider, useArchiveApi } from '@/components/archive/ArchiveApiProvider';
import { FriendAvatar } from '@/components/friends/FriendAvatar';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { useApiResource } from '@/hooks/common/useApiResource';
import { friendsRepository } from '@/lib/friendsService';
import { letterFailure, letterImageUrl, letterRouteId } from '@/lib/letterService';

const FriendState = ({ error, reload }: { error: unknown; reload: () => void }) => <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px] text-center">{error ? <><p role="alert" className="text-14 text-error">{letterFailure(error)}</p><Button onClick={reload}>다시 확인</Button></> : <p role="status" className="text-14 text-gray-m-500">회원 정보를 불러오고 있어요.</p>}<Link href="/friends" className="min-h-[44px] text-14 underline">친구 검색으로 돌아가기</Link></div>;
const FriendArchiveAccess = ({ children, refreshMember }: { children: ReactNode; refreshMember: () => void }) => {
  const archive = useArchiveApi();
  if (archive.error) return <FriendState error={archive.error} reload={() => { refreshMember(); archive.reload(); }} />;
  if (!archive.data) return <FriendState error={null} reload={archive.reload} />;
  return children;
};
const RestrictedArchive = ({ member, replace, reload }: { member: FriendMember; replace: (member: FriendMember) => void; reload: () => void }) => {
  const flow = useMemo(() => createFriendRequest(friendsRepository, member.memberId, member.followStatus), [member.memberId, member.followStatus]);
  const [pending, setPending] = useState(false); const busy = useRef(false); const mounted = useRef(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const request = async () => {
    if (busy.current || member.followStatus === 'REQUESTED') return;
    busy.current = true; setPending(true); setError(null);
    try { const updated = await flow.send(); if (mounted.current) replace(updated); }
    catch (cause) { if (mounted.current) setError(letterFailure(cause)); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  return <div className="relative isolate flex min-h-[560px] flex-1 flex-col bg-[#fafaf1]">
    <Header title={`${member.nickname}의 아카이브`} className="bg-[#fafaf1]" paddingClassName="px-[24px]" left={<Link href="/friends" aria-label="친구 검색으로 돌아가기" className="rounded-full focus-visible:outline-2 focus-visible:outline-orange"><FriendAvatar src={letterImageUrl(member.profileImageUrl) ?? null} size={40} /></Link>} />
    <div aria-hidden="true" className="pointer-events-none relative min-h-[520px] flex-1 overflow-hidden"><div className="absolute inset-[-12px] blur-[8px]" style={{ backgroundImage: 'linear-gradient(to right,#e4e4db55 1px,transparent 1px),linear-gradient(to bottom,#e4e4db55 1px,transparent 1px)', backgroundSize: '28px 28px' }}>{[0, 1, 2, 3, 4, 5].map(index => <span key={index} className="absolute size-[48px] rounded-[12px] bg-gray-m-200 opacity-60" style={{ left: `${[4, 75, 52, 12, 67, 25][index]}%`, top: `${[12, 24, 41, 55, 70, 88][index]}%` }} />)}</div></div>
    <div className="absolute inset-x-[24px] bottom-[max(40px,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-[12px]">
      {error && <p role="alert" className="text-center text-12 text-error">{error}</p>}
      <Button fullWidth={false} disabled={pending || member.followStatus === 'REQUESTED'} onClick={() => void request()} className="w-[170px]">{pending ? '요청 중...' : member.followStatus === 'REQUESTED' ? '요청함' : '친구 요청'}</Button>
      <button type="button" disabled={pending} onClick={reload} className="min-h-[36px] text-12 text-gray-m-500 underline">관계 상태 새로고침</button>
      <p role="status" className="sr-only">{member.followStatus === 'REQUESTED' ? '친구 요청함' : member.followStatus === 'RECEIVED' ? '상대가 보낸 요청이 있어요. 친구 요청을 보내면 서로 친구가 됩니다.' : '친구가 되면 아카이브를 볼 수 있어요.'}</p>
    </div>
  </div>;
};
export const FriendArchiveLayout = ({ memberId, children }: { memberId: string; children: ReactNode }) => {
  const loader = useCallback(() => friendsRepository.member(letterRouteId(memberId)), [memberId]);
  const resource = useApiResource(`friend:${memberId}`, loader);
  const reload = resource.reload;
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; });
  useEffect(() => {
    let last = 0;
    const refresh = () => { if (document.visibilityState === 'visible' && Date.now() - last > 2000) { last = Date.now(); reloadRef.current(); } };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  if (resource.error || !resource.data) return <FriendState error={resource.error} reload={reload} />;
  const member = resource.data;
  if (member.followStatus === 'SELF') return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream"><p>내 프로필이에요.</p><Link href="/archive" className="min-h-[44px] underline">내 아카이브로 이동</Link></div>;
  if (member.followStatus !== 'FRIEND') return <RestrictedArchive key={memberId} member={member} replace={resource.replace} reload={reload} />;
  return <ArchiveApiProvider key={memberId} memberId={member.memberId}><FriendArchiveAccess refreshMember={reload}>{children}</FriendArchiveAccess></ArchiveApiProvider>;
};
