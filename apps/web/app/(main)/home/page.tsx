'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * 홈 화면 자리 (홈 화면 이슈에서 교체 예정)
 * 화면 분기 확인용으로 로그아웃 버튼만 둔다.
 */
const HomePage = () => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page">
      <p className="text-16 font-medium text-gray-m-800">홈 화면은 준비 중이에요</p>
      <Button variant="primary" onClick={logout}>
        로그아웃 (테스트용)
      </Button>
    </div>
  );
};

export default HomePage;
