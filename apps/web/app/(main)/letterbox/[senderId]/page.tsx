import { LetterboxScreen } from '@/components/letterbox/LetterboxScreen';

export default async function SenderLettersPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <LetterboxScreen senderId={senderId} />;
}
