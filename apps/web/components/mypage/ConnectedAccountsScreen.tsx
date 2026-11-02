'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { MypageShell } from '@/components/mypage/MypageShell';
import { Popup } from '@/components/ui/Popup';

const PROVIDERS = [
  { id: 'GOOGLE', label: '구글', icon: '/icons/social-google.svg' },
  { id: 'NAVER', label: '네이버', icon: '/icons/social-naver.svg' },
  { id: 'KAKAO', label: '카카오', icon: '/icons/social-kakao.svg' },
] as const;

export const ConnectedAccountsScreen = () => {
  const { connected: resource } = useMypageApi();
  const [selected, setSelected] = useState<typeof PROVIDERS[number]['id'] | null>(null);
  const provider = PROVIDERS.find(item => item.id === selected);
  const connected = selected ? resource.data?.connectedProviders.includes(selected) : false;
  return (
    <MypageShell title="연결 계정">
      {resource.data ? <div className="mt-[40px] px-page">
        {PROVIDERS.map(item => <div key={item.id} className="flex min-h-[76px] items-center gap-[16px] border-b border-gray-m-100 py-[16px]">
          <Image src={item.icon} alt="" width={28} height={28} />
          <div className="flex-1"><p className="text-16">{item.label}</p><p className="mt-[4px] text-12 text-gray-m-400">{resource.data?.connectedProviders.includes(item.id) ? '연결됨' : '연결 안 됨'}</p></div>
          <button type="button" onClick={() => setSelected(item.id)} aria-label={`${item.label} 계정 ${resource.data?.connectedProviders.includes(item.id) ? '연결 해제' : '연결하기'}`}
            className="rounded-control border border-gray-m-100 px-[12px] py-[8px] text-14 focus-visible:outline-2 focus-visible:outline-orange">{resource.data?.connectedProviders.includes(item.id) ? '연결 해제' : '연결하기'}</button>
        </div>)}
      </div> : <ProfileLoadState error={resource.error} reload={resource.reload} />}
      <Popup isOpen={selected !== null} title={`${provider?.label ?? ''} 계정 ${connected ? '연결 해제' : '연결'}`}
        description="소셜 계정 연결·해제 기능은 준비 중이에요."
        showCancel={false} confirmLabel="확인" onCancel={() => setSelected(null)} onConfirm={() => setSelected(null)} />
    </MypageShell>
  );
};
