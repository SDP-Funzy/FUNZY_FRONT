'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { canDisconnectSocial } from '@sdp/core';
import type { SocialProvider } from '@sdp/core';

import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { MypageShell } from '@/components/mypage/MypageShell';
import { Popup } from '@/components/ui/Popup';
import { disconnectSocialAccount } from '@/lib/profileService';
import { letterFailure } from '@/lib/letterService';

const PROVIDERS = [
  { id: 'GOOGLE', label: '구글', icon: '/icons/social-google.svg' },
  { id: 'NAVER', label: '네이버', icon: '/icons/social-naver.svg' },
  { id: 'KAKAO', label: '카카오', icon: '/icons/social-kakao.svg' },
] as const;

export const ConnectedAccountsScreen = () => {
  const { connected: resource } = useMypageApi();
  const [selected, setSelected] = useState<SocialProvider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const busy = useRef(false); const mounted = useRef(true); const active = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.abort(); }; }, []);
  const provider = PROVIDERS.find(item => item.id === selected);
  const disconnect = async () => {
    if (busy.current || !selected || !resource.data || resource.loading || resource.error || needsRefresh) return;
    busy.current = true; setPending(true);
    const controller = new AbortController(); active.current = controller;
    try {
      const result = await disconnectSocialAccount(selected, controller.signal);
      if (!mounted.current) return;
      resource.replace(result.accounts);
      setNeedsRefresh(!result.confirmed);
      setSelected(null);
      setNotice(result.confirmed ? `${provider?.label ?? '소셜'} 계정 연결을 해제했어요.` : '연결 해제 요청은 처리됐지만 최신 연결 상태를 확인하지 못했어요. 연결 상태를 다시 불러와 주세요.');
    } catch (error) {
      if (!mounted.current) return;
      setSelected(null); setNotice(letterFailure(error));
      await resource.reload();
    } finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  const refresh = async () => { await resource.reload(); if (mounted.current) setNeedsRefresh(false); };
  return (
    <MypageShell title="연결 계정">
      {resource.data && !resource.error ? <div aria-busy={pending || resource.loading} className="mt-[40px] px-page">
        {PROVIDERS.map(item => {
          const connected = resource.data!.connectedProviders.includes(item.id);
          const last = connected && !canDisconnectSocial(resource.data!, item.id);
          return <div key={item.id} className="flex min-h-[76px] items-center gap-[16px] border-b border-gray-m-100 py-[16px]">
          <Image src={item.icon} alt="" width={28} height={28} />
          <div className="min-w-0 flex-1"><p className="text-16">{item.label}</p><p className="mt-[4px] text-12 text-gray-m-400">{connected ? '연결됨' : '연결 안 됨'}</p>{last && <p id={`last-login-${item.id}`} className="mt-[4px] text-12 leading-[1.5] text-gray-m-500">마지막 로그인 수단은 해제할 수 없어요.</p>}</div>
          <button type="button" disabled={pending || resource.loading || needsRefresh || last} aria-describedby={last ? `last-login-${item.id}` : undefined}
            onClick={() => connected ? setSelected(item.id) : setNotice('소셜 계정 연결은 아직 준비 중이에요.')} aria-label={`${item.label} 계정 ${connected ? '연결 해제' : '연결하기'}`}
            className="min-h-[44px] shrink-0 rounded-control border border-gray-m-100 px-[12px] py-[8px] text-14 focus-visible:outline-2 focus-visible:outline-orange disabled:opacity-40">{connected ? '연결 해제' : '연결하기'}</button>
        </div>; })}
        {pending && <p role="status" className="mt-[16px] text-12 text-gray-m-500">연결 해제를 처리하고 있어요.</p>}
        {needsRefresh && <div className="mt-[16px] text-12"><p role="status" className="text-gray-m-500">다른 계정을 해제하기 전에 최신 연결 상태를 확인해 주세요.</p><button type="button" disabled={resource.loading} onClick={() => { void refresh(); }} className="min-h-[44px] underline">연결 상태 다시 불러오기</button></div>}
      </div> : <ProfileLoadState error={resource.error} reload={resource.reload} />}
      <Popup isOpen={selected !== null} title={`${provider?.label ?? ''} 계정 연결 해제`}
        description={`연결을 해제하면 이 ${provider?.label ?? '소셜'} 계정으로 로그인할 수 없어요. 연결을 해제할까요?`}
        cancelLabel="취소" confirmLabel={pending ? '해제 중...' : '연결 해제'} onCancel={() => { if (!busy.current) setSelected(null); }} onConfirm={() => { void disconnect(); }} />
      <Popup isOpen={notice !== null} title="안내" description={notice ?? undefined} showCancel={false} confirmLabel="확인" onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </MypageShell>
  );
};
