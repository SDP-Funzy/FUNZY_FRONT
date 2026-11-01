import { AccountUnlockScreen } from '@/components/auth/AccountUnlockScreen';

export default async function AccountUnlockPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === 'string' ? token : '';
  return <AccountUnlockScreen key={value} token={value} />;
}
