import { ReceivedCardDetailScreen } from '@/components/letterbox/ReceivedCardDetailScreen';

export default async function LetterDetailPage({ params }: { params: Promise<{ senderId: string; letterId: string }> }) {
  const { senderId, letterId } = await params;
  return <ReceivedCardDetailScreen key={letterId} id={senderId} cardId={letterId} />;
}
