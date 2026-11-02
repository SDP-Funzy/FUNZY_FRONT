import type { GiftPhoto } from '@/components/write/GiftDraftProvider';

export const MAX_GIFT_PHOTO_BYTES = 5 * 1024 * 1024;

export const prepareGiftPhoto = async (file: File): Promise<GiftPhoto> => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
    throw new Error('JPG, PNG, WebP, GIF, AVIF 사진을 선택해 주세요.');
  }
  if (file.size > MAX_GIFT_PHOTO_BYTES) throw new Error('5MB 이하의 사진을 선택해 주세요.');
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => image.naturalWidth > 0 ? resolve() : reject(new Error('사진을 읽을 수 없어요.'));
      image.onerror = () => reject(new Error('사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'));
      image.src = url;
    });
    return { file, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
};
