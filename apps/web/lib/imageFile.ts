/** 마음카드 API 업로드 정책 */
export const MAX_CARD_PHOTO_BYTES = 5 * 1024 * 1024;

export type ImageFileCheck = { ok: true } | { ok: false; reason: 'notImage' | 'tooLarge' };

/** 고른 파일이 사진으로 쓸 수 있는지 */
export const checkCardPhoto = (file: File): ImageFileCheck => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return { ok: false, reason: 'notImage' };
  if (file.size > MAX_CARD_PHOTO_BYTES) return { ok: false, reason: 'tooLarge' };
  return { ok: true };
};
