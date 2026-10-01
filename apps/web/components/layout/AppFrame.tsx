import type { ReactNode } from 'react';

import { OVERLAY_ROOT_ID } from '@/lib/overlay';

type AppFrameProps = {
  children: ReactNode;
};

/**
 * 앱 전체를 감싸는 프레임
 * - 모바일(768px 미만): 화면 폭 100%, 문서 자체가 스크롤 (주소창 접힘 등 브라우저 기본 동작 유지)
 * - PC, 태블릿(768px 이상): 가운데 402px 프레임 + 양옆 흰색, 스크롤은 프레임 안에서만
 *   양옆과 화면 배경이 둘 다 흰색일 때 경계가 보이도록 좌우에 연한 테두리
 * - 팝업 등은 오버레이 영역에 띄워서 PC 에서도 프레임 밖으로 넘치지 않게 한다
 */
export const AppFrame = ({ children }: AppFrameProps) => {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full flex-col md:h-dvh md:max-w-[402px] md:overflow-hidden md:border-x md:border-gray-pc-200">
      <main className="flex flex-1 flex-col pt-safe md:overflow-y-auto">{children}</main>
      <div id={OVERLAY_ROOT_ID} className="pointer-events-none fixed inset-0 z-50 md:absolute" />
    </div>
  );
};
