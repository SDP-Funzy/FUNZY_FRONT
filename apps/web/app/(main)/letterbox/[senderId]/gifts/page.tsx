import { ReceivedGiftScreen } from '@/components/letterbox/ReceivedGiftScreen';
export default async function ReceivedGiftsPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <ReceivedGiftScreen key={senderId} senderId={senderId} />;
}
