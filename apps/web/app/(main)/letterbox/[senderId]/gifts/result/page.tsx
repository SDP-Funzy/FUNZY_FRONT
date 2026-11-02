import { GiftSelectionResultScreen } from '@/components/letterbox/GiftSelectionResultScreen';
export default async function GiftSelectionResultPage({ params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return <GiftSelectionResultScreen senderId={senderId} />;
}
