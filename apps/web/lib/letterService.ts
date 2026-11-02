import { ApiError, createHttpLetterRepository, createLetterDelivery, isApiError } from '@sdp/core';
import type { LetterImageUpload, LetterPhoto, SharedLetter } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';
import { SHARED_LETTER_PATH } from '@/lib/sharedLetterReturn';

export const letterRepository = createHttpLetterRepository(apiClient);
export const letterImageUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  try {
    const url = new URL(value, process.env.NEXT_PUBLIC_API_BASE_URL);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
};
export const uploadLetterPhoto = async (target: LetterImageUpload, photo: LetterPhoto) => {
  const url = letterImageUrl(target.uploadUrl);
  if (!url || !(photo.body instanceof Blob)) throw new ApiError(400, 'CARD_UPLOAD_INVALID', '사진을 업로드할 수 없어요. 다른 사진을 선택해 주세요.');
  let response: Response;
  try { response = await fetch(url, { method: 'PUT', body: photo.body, headers: { 'Content-Type': photo.type }, credentials: 'omit', redirect: 'error' }); }
  catch { throw new ApiError(0, 'CARD_UPLOAD_FAILED', '사진 업로드에 실패했어요. 연결을 확인하고 다시 시도해 주세요.'); }
  if (!response.ok) throw new ApiError(response.status, 'CARD_UPLOAD_FAILED', '사진 업로드에 실패했어요. 다시 시도해 주세요.');
};
export const newLetterDelivery = () => createLetterDelivery(letterRepository, uploadLetterPhoto);
export const letterFailure = (error: unknown) => isApiError(error) ? error.message : '요청을 완료하지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
export const letterRouteId = (value: string) => {
  const id = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'COMMON_002', '편지를 찾을 수 없어요.');
  return id;
};
export const sharedLetterUrl = (token: string) => new URL(`${SHARED_LETTER_PATH}/${encodeURIComponent(token)}`, window.location.origin).href;
export const loadSharedLetter = async (token: string, authenticated: boolean, signal: AbortSignal): Promise<SharedLetter> => {
  const shared = await letterRepository.shared(token, authenticated);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!authenticated || !shared.receivable || !['OTHER', 'RECIPIENT'].includes(shared.viewer)) return shared;
  try { await letterRepository.receive(token); }
  catch (error) { if (!isApiError(error) || error.code !== 'LETTER_012') throw error; }
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return letterRepository.shared(token, true);
};
