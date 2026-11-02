import { LetterDetailScreen } from '@/components/letterbox/LetterDetailScreen';

export default async function LetterDetailPage({ params }: { params: Promise<{ senderId: string; letterId: string }> }) {
  const { senderId, letterId } = await params;
  return <LetterDetailScreen key={letterId} senderId={senderId} letterId={letterId} />;
}
