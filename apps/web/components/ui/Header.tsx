import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * 화면 상단 헤더
 * 피그마에서는 화면마다 요소를 직접 배치했기 때문에, 공통 구조(왼쪽, 가운데 제목, 오른쪽)만 잡고
 * 내용은 슬롯으로 받는다.
 *   - 하위 페이지형: left = 뒤로가기, title = "편지 보관함", right = 검색
 *   - 홈형: left = 로고, right = 프로필(환경설정) + 알림 버튼
 * 배경색은 화면마다 다르므로 className 으로 지정한다. (예: 홈은 bg-cream)
 */
type HeaderProps = {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export const Header = ({ title, left, right, className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 grid h-[60px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-[21px]',
        className,
      )}
    >
      <div className="flex items-center justify-self-start">{left}</div>
      {title ? <h1 className="text-18 font-bold whitespace-nowrap text-black">{title}</h1> : <span />}
      <div className="flex items-center gap-[13px] justify-self-end">{right}</div>
    </header>
  );
};
