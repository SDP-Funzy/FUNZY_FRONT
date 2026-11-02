import { createHttpProfileRepository } from '@sdp/core';
import type { AccountProvider } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';
export const profileRepository = createHttpProfileRepository(apiClient);
export const accountProviderLabel: Record<AccountProvider, string> = { LOCAL: '이메일', GOOGLE: '구글', NAVER: '네이버', KAKAO: '카카오' };
