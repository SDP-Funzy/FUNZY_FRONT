import type { Metadata } from 'next';
import { SharedLetterScreen } from '@/components/receive/SharedLetterScreen';

export const metadata: Metadata = { title: '도착한 편지 | Funzy' };
export default async function SharedLetterPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ card?: string | string[] }> }) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  return <SharedLetterScreen key={token} token={token} initialCard={typeof query.card === 'string' ? query.card : undefined} />;
}
