import { MypageShell } from '@/components/mypage/MypageShell';

export const PoliciesScreen = () => (
  <MypageShell title="약관 및 정책">
    <div className="mt-[24px] px-page">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between py-[16px] text-16 text-gray-m-500 focus-visible:outline-2 focus-visible:outline-orange [&::-webkit-details-marker]:hidden">
          약관 및 정책 <span aria-hidden="true">⌄</span>
        </summary>
        <div className="space-y-[24px] border-t border-gray-m-100 py-[24px] text-14 leading-[1.8]">
          <p className="text-gray-m-500">아래 내용은 화면 확인용 임시 안내입니다. 정식 약관과 개인정보처리방침은 확정 후 제공할 예정이에요.</p>
          <section><h2 className="font-semibold">이용약관</h2><p className="mt-[8px]">FUNZY는 소중한 사람과 편지를 주고받고 보관하는 서비스입니다. 서비스 이용 조건과 운영 기준은 정식 이용약관에서 안내할 예정입니다.</p></section>
          <section><h2 className="font-semibold">개인정보처리방침</h2><p className="mt-[8px]">개인정보의 수집 항목, 이용 목적, 보유 기간, 이용자의 권리와 문의처는 정식 개인정보처리방침에서 안내할 예정입니다.</p></section>
        </div>
      </details>
    </div>
  </MypageShell>
);
