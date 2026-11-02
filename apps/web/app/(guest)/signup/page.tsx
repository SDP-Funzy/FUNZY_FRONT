import { SignupScreen } from '@/components/auth/SignupScreen';
import { getSafeSharedReturnTo } from '@/lib/sharedLetterReturn';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  return <SignupScreen returnTo={getSafeSharedReturnTo(query.next)} />;
}
