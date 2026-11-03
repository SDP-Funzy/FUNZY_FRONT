import { ApiError, createHttpProfileRepository, validateProfilePhoto } from '@sdp/core';
import type { AccountProvider, ProfileImageUpload, ProfilePhoto } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';
import { letterImageUrl } from '@/lib/letterService';
export const profileRepository = createHttpProfileRepository(apiClient);
export const accountProviderLabel: Record<AccountProvider, string> = { LOCAL: '이메일', GOOGLE: '구글', NAVER: '네이버', KAKAO: '카카오' };
export const validateProfileImageFile = async (file: File) => {
  validateProfilePhoto({ type: file.type, size: file.size, body: file });
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => image.naturalWidth > 0 ? resolve() : reject(new ApiError(400, 'MYPAGE_002', '사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'));
      image.onerror = () => reject(new ApiError(400, 'MYPAGE_002', '사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
};
export const uploadProfilePhoto = async (target: ProfileImageUpload, photo: ProfilePhoto) => {
  const url = letterImageUrl(target.uploadUrl);
  if (!url || !(photo.body instanceof Blob)) throw new ApiError(400, 'MYPAGE_002', '사진을 업로드할 수 없어요. 다른 사진을 선택해 주세요.');
  let response: Response;
  try { response = await fetch(url, { method: 'PUT', body: photo.body, headers: { 'Content-Type': photo.type }, credentials: 'omit', redirect: 'error' }); }
  catch { throw new ApiError(0, 'PROFILE_UPLOAD_FAILED', '사진 업로드에 실패했어요. 연결을 확인하고 다시 시도해 주세요.'); }
  if (!response.ok) throw new ApiError(response.status, 'PROFILE_UPLOAD_FAILED', '사진 업로드에 실패했어요. 다시 시도해 주세요.');
};
