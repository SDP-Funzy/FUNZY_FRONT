import type { Metadata } from 'next';

import { LoginScreen } from '@/components/auth/LoginScreen';
import { getSafeSharedReturnTo } from '@/lib/sharedLetterReturn';

export const metadata: Metadata = {
  title: '로그인 | Funzy',
};

const LoginPage = async ({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) => {
  const query = await searchParams;
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <LoginScreen returnTo={getSafeSharedReturnTo(query.next)} />
    </div>
  );
};

export default LoginPage;
