import { ServerGiftScreen } from '@/components/letterbox/ServerGiftScreen';
export default async function ReceivedGiftsPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <ServerGiftScreen key={senderId} id={senderId} />;
}
