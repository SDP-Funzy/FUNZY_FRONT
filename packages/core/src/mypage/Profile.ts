import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';

export const ACCOUNT_PROVIDERS = ['LOCAL', 'GOOGLE', 'NAVER', 'KAKAO'] as const;
export type AccountProvider = typeof ACCOUNT_PROVIDERS[number];
export type MemberProfile = { nickname: string; profileImageUrl: string | null; provider: AccountProvider; name?: string | null; email?: string | null };
export type ConnectedAccounts = { connectedProviders: AccountProvider[]; hasPassword: boolean };
export type ProfileImageUpload = { uploadUrl: string; imageKey: string; imageUrl: string; method: 'PUT'; expiresAt: string };
export type ProfilePhoto = { type: string; size: number; body: unknown };
export const isProfileNickname = (value: string) => /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{2,20}$/.test(value);
export const validateProfileNickname = (value: string) => {
  const nickname = value.trim();
  if (!isProfileNickname(nickname)) throw new ApiError(400, 'COMMON_002', '아이디는 영문 소문자·숫자·마침표·밑줄로 2~20자 입력해 주세요. 마침표는 처음·끝·연속으로 사용할 수 없어요.');
  return nickname;
};
export const validateProfilePhoto = (photo: ProfilePhoto) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) throw new ApiError(400, 'MYPAGE_002', 'JPG, PNG, WebP 사진을 선택해 주세요.');
  if (photo.size <= 0 || photo.size > 5 * 1024 * 1024) throw new ApiError(400, 'MYPAGE_003', '사진은 5MB 이하로 선택해 주세요.');
};
const invalid = () => new ApiError(502, 'PROFILE_RESPONSE_INVALID', '프로필 응답을 확인하지 못했어요. 다시 시도해 주세요.');
const profileResponse = (data: MemberProfile): MemberProfile => {
  if (!data || typeof data.nickname !== 'string' || !data.nickname.trim() || !ACCOUNT_PROVIDERS.includes(data.provider) || !(data.profileImageUrl === null || typeof data.profileImageUrl === 'string')) throw invalid();
  if ((data.name != null && typeof data.name !== 'string') || (data.email != null && typeof data.email !== 'string')) throw invalid();
  return data;
};
export const createHttpProfileRepository = (http: HttpClient) => ({
  profile: async (): Promise<MemberProfile> => profileResponse(await http.get<MemberProfile>('/api/mypage/profile')),
  changeNickname: async (value: string): Promise<void> => { await http.patch('/api/mypage/profile/nickname', { nickname: validateProfileNickname(value) }); },
  resetImage: async (): Promise<void> => { await http.delete('/api/mypage/profile/image'); },
  presignImage: async (photo: ProfilePhoto): Promise<ProfileImageUpload> => {
    validateProfilePhoto(photo);
    const data = await http.post<ProfileImageUpload>('/api/mypage/profile/image/presigned-url', { contentType: photo.type });
    if (!data || typeof data.uploadUrl !== 'string' || !data.uploadUrl || typeof data.imageKey !== 'string' || !data.imageKey || typeof data.imageUrl !== 'string' || !data.imageUrl || data.method !== 'PUT' || !Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= Date.now()) throw invalid();
    return data;
  },
  completeImage: async (imageKey: string): Promise<MemberProfile> => {
    if (!imageKey.trim()) throw new ApiError(400, 'COMMON_002', '업로드한 사진을 확인해 주세요.');
    return profileResponse(await http.post<MemberProfile>('/api/mypage/profile/image/complete', { imageKey }));
  },
  connected: async (): Promise<ConnectedAccounts> => {
    const data = await http.get<ConnectedAccounts>('/api/mypage/account/connected');
    if (!data || typeof data.hasPassword !== 'boolean' || !Array.isArray(data.connectedProviders) || data.connectedProviders.some(provider => !ACCOUNT_PROVIDERS.includes(provider))) throw invalid();
    return data;
  },
});
export type ProfileRepository = ReturnType<typeof createHttpProfileRepository>;
