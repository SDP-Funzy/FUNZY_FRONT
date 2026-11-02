import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';

export const ACCOUNT_PROVIDERS = ['LOCAL', 'GOOGLE', 'NAVER', 'KAKAO'] as const;
export type AccountProvider = typeof ACCOUNT_PROVIDERS[number];
export type MemberProfile = { nickname: string; profileImageUrl: string | null; provider: AccountProvider };
export type ConnectedAccounts = { connectedProviders: AccountProvider[]; hasPassword: boolean };
const invalid = () => new ApiError(502, 'PROFILE_RESPONSE_INVALID', '프로필 응답을 확인하지 못했어요. 다시 시도해 주세요.');
export const createHttpProfileRepository = (http: HttpClient) => ({
  profile: async (): Promise<MemberProfile> => {
    const data = await http.get<MemberProfile>('/api/mypage/profile');
    if (!data || typeof data.nickname !== 'string' || !data.nickname.trim() || !ACCOUNT_PROVIDERS.includes(data.provider) || !(data.profileImageUrl === null || typeof data.profileImageUrl === 'string')) throw invalid();
    return data;
  },
  connected: async (): Promise<ConnectedAccounts> => {
    const data = await http.get<ConnectedAccounts>('/api/mypage/account/connected');
    if (!data || typeof data.hasPassword !== 'boolean' || !Array.isArray(data.connectedProviders) || data.connectedProviders.some(provider => !ACCOUNT_PROVIDERS.includes(provider))) throw invalid();
    return data;
  },
});
