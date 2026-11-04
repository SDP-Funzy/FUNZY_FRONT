import type { HttpClient } from '../shared/http/HttpClient';
import type { TokenStore } from '../shared/storage/TokenStore';

export const createWithdrawAccount = (http: Pick<HttpClient, 'delete'>, tokens: Pick<TokenStore, 'clear'>) => {
  let pending: Promise<void> | null = null;
  const run = async () => {
    await http.delete('/api/mypage/account');
    await tokens.clear();
  };
  return () => {
    pending ??= run().finally(() => { pending = null; });
    return pending;
  };
};
