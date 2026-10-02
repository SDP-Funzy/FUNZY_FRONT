import type { Metadata } from 'next';

import { LoginScreen } from '@/components/auth/LoginScreen';

export const metadata: Metadata = {
  title: '로그인 | Funzy',
};

const LoginPage = () => {
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <LoginScreen />
    </div>
  );
};

export default LoginPage;
