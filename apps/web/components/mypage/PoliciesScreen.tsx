import { MypageShell } from '@/components/mypage/MypageShell';
import { PolicyDocument, PolicyIntroduction } from '@/components/legal/PolicyDocument';
import Image from 'next/image';

export const PoliciesScreen = () => (
  <MypageShell title="약관 및 정책">
    <div className="mt-[24px] min-w-0 px-page pb-[calc(32px+env(safe-area-inset-bottom,0px))]">
      <PolicyIntroduction />
      {([{ kind: 'terms', label: '서비스 이용약관' }, { kind: 'privacy', label: '개인정보처리방침' }] as const).map(item => <details key={item.kind} className="mt-[16px] min-w-0 border-t border-gray-m-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-[12px] py-[16px] text-16 text-gray-m-500 focus-visible:outline-2 focus-visible:outline-orange [&::-webkit-details-marker]:hidden">{item.label}<Image src="/icons/chevron-down.svg" alt="" width={14} height={10} className="shrink-0" /></summary>
        <div className="min-w-0 pb-[24px]"><PolicyDocument kind={item.kind} introduction={false} showTitle={false} /></div>
      </details>)}
    </div>
  </MypageShell>
);
