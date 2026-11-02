export type ReceivedGift = { id: string; image: string; label: string };
export type ReceivedGiftPack = { id: string; senderId: string; sender: string; recipient: string; gifts: ReceivedGift[]; selectedGiftId: string | null };

export const createReceivedGiftPacks = (): ReceivedGiftPack[] => ['YESEUNG', 'JHeee', 'MINSOL', 'Rayul', 'FunFun', 'SUJIN'].map((sender, index) => ({
  id: `received-${index + 1}`, senderId: String(index + 1), sender, recipient: 'FunFun',
  gifts: [{ id: 'gift-1', image: '/images/gifts/gift-01.svg', label: '우산 꽂힌 음료' }],
  selectedGiftId: index === 1 ? 'gift-1' : null,
}));

export const selectReceivedGift = (packs: ReceivedGiftPack[], senderId: string, giftId: string): ReceivedGiftPack[] => packs.map(pack =>
  pack.senderId === senderId && pack.gifts.some(gift => gift.id === giftId) ? { ...pack, selectedGiftId: giftId } : pack);
