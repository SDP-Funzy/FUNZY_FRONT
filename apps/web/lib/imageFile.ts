/** 마음카드 사진으로 받을 수 있는 최대 크기 (서버 업로드 정책 확정 전 임시값) */
export const MAX_CARD_PHOTO_BYTES = 10 * 1024 * 1024;

export type ImageFileCheck = { ok: true } | { ok: false; reason: 'notImage' | 'tooLarge' };

/** 고른 파일이 사진으로 쓸 수 있는지 */
export const checkCardPhoto = (file: File): ImageFileCheck => {
  if (!file.type.startsWith('image/')) return { ok: false, reason: 'notImage' };
  if (file.size > MAX_CARD_PHOTO_BYTES) return { ok: false, reason: 'tooLarge' };
  return { ok: true };
};
