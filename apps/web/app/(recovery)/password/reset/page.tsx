import { PasswordResetScreen } from '@/components/auth/PasswordResetScreen';

export default async function PasswordResetPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === 'string' ? token : '';
  return <PasswordResetScreen key={value} token={value} />;
}
