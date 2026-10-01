'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Popup } from '@/components/ui/Popup';

/**
 * 공통 UI 부품 확인용 페이지 (/ui-preview)
 * 피그마 공통 컴포넌트와 나란히 놓고 비교하는 용도. 배포 전에 지우거나 개발 환경에서만 노출할 것.
 */
const UiPreviewPage = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('내 이름');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Header
        title="UI 미리보기"
        left={<IconButton iconSrc="/icons/arrow-back.svg" label="뒤로가기" />}
        right={<IconButton iconSrc="/icons/search.svg" label="검색" />}
        className="bg-cream"
      />

      <div className="flex flex-col gap-[40px] px-page py-[24px]">
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-14 font-semibold text-gray-pc-500">Input</h2>
          <Input
            placeholder="플레이스 홀더"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClear={() => setName('')}
          />
          <Input
            defaultValue="입력한 정보"
            isError
            hints={[
              { label: '2~20자', isActive: true },
              { label: '중복 불가', isActive: true },
              { label: '즉시 반영', isActive: false },
            ]}
          />
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            action={{ label: '중복확인', onClick: () => {} }}
          />
        </section>

        <section className="flex flex-col gap-[20px]">
          <h2 className="text-14 font-semibold text-gray-pc-500">Button</h2>
          <Button variant="primary">버튼</Button>
          <Button variant="accent">버튼</Button>
          <Button disabled>버튼</Button>
        </section>

        <section className="flex flex-col gap-[12px]">
          <h2 className="text-14 font-semibold text-gray-pc-500">Popup</h2>
          <Button variant="accent" onClick={() => setIsPopupOpen(true)}>
            로그아웃 팝업 열기
          </Button>
        </section>
      </div>

      <Popup
        isOpen={isPopupOpen}
        title="로그아웃"
        description="로그아웃 하실?"
        cancelLabel="취소"
        confirmLabel="로그아웃"
        onCancel={() => setIsPopupOpen(false)}
        onConfirm={() => setIsPopupOpen(false)}
      />
    </div>
  );
};

export default UiPreviewPage;
