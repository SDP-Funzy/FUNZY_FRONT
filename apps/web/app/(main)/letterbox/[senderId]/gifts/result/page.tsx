import { ServerGiftScreen } from '@/components/letterbox/ServerGiftScreen';
export default async function GiftSelectionResultPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <ServerGiftScreen id={senderId} result />;
}
