import { ApiError, isApiError } from '../shared/http/ApiError';
import type { AccountProvider, ConnectedAccounts, ProfileRepository } from './Profile';

export type SocialProvider = Exclude<AccountProvider, 'LOCAL'>;
export type SocialDisconnectResult = { accounts: ConnectedAccounts; confirmed: boolean };
export const canDisconnectSocial = (accounts: ConnectedAccounts, provider: SocialProvider) => {
  const social = new Set(accounts.connectedProviders.filter(item => item !== 'LOCAL'));
  return social.has(provider) && (accounts.hasPassword || social.size > 1);
};
export const makeDisconnectSocial = (repo: Pick<ProfileRepository, 'connected' | 'disconnectSocial'>) => {
  let pending: Promise<SocialDisconnectResult> | null = null;
  const run = async (provider: SocialProvider, signal?: AbortSignal): Promise<SocialDisconnectResult> => {
    if (!['GOOGLE', 'NAVER', 'KAKAO'].includes(provider)) throw new ApiError(400, 'COMMON_002', '해제할 소셜 계정을 확인해 주세요.');
    signal?.throwIfAborted();
    // 확인 팝업을 연 뒤 다른 기기에서 로그인 수단을 바꿨을 수도 있으므로 재조회한다.
    const current = await repo.connected(signal);
    signal?.throwIfAborted();
    if (!current.connectedProviders.includes(provider)) return { accounts: current, confirmed: true };
    if (!canDisconnectSocial(current, provider)) throw new ApiError(400, 'AUTH_020', '마지막 남은 로그인 수단은 연결 해제할 수 없습니다.');
    try { await repo.disconnectSocial(provider, signal); }
    catch (error) {
      signal?.throwIfAborted();
      // 서버 처리 후 응답이 유실됐거나 다른 기기에서 이미 해제한 경우, 재삭제 대신 조회로 확인한다.
      if (isApiError(error) && (error.code === 'AUTH_019' || error.status === 0 || error.status >= 500)) {
        try {
          const latest = await repo.connected(signal);
          signal?.throwIfAborted();
          if (!latest.connectedProviders.includes(provider)) return { accounts: latest, confirmed: true };
        } catch { signal?.throwIfAborted(); }
      }
      throw error;
    }
    signal?.throwIfAborted();
    try {
      const latest = await repo.connected(signal);
      signal?.throwIfAborted();
      if (!latest.connectedProviders.includes(provider)) return { accounts: latest, confirmed: true };
    } catch { signal?.throwIfAborted(); }
    return { accounts: { ...current, connectedProviders: current.connectedProviders.filter(item => item !== provider) }, confirmed: false };
  };
  return (provider: SocialProvider, signal?: AbortSignal) => {
    pending ??= run(provider, signal).finally(() => { pending = null; });
    return pending;
  };
};
