import { ReceivedLetterCardsScreen } from '@/components/letterbox/ReceivedLetterCardsScreen';

export default async function SenderLettersPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <ReceivedLetterCardsScreen id={senderId} />;
}
