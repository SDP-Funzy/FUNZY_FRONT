import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { TokenStore } from '../shared/storage/TokenStore';

export type PasswordChangeInput = { currentPassword: string; newPassword: string; newPasswordConfirm: string };
export type PushSetting = { pushNotificationEnabled: boolean };
export type AccountSettingsRepository = { changePassword(input: PasswordChangeInput): Promise<void>; pushSetting(): Promise<PushSetting>; updatePushSetting(enabled: boolean): Promise<void> };
export const validatePasswordChange = (input: PasswordChangeInput) => {
  if (!input.currentPassword) throw new ApiError(400, 'COMMON_002', '현재 비밀번호를 입력해 주세요.');
  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(input.newPassword)) throw new ApiError(400, 'COMMON_002', '새 비밀번호는 8자 이상 영문·숫자·특수문자를 조합해 주세요.');
  if (new TextEncoder().encode(input.newPassword).byteLength > 72) throw new ApiError(400, 'COMMON_002', '새 비밀번호는 72바이트 이하로 입력해 주세요.');
  if (input.newPassword !== input.newPasswordConfirm) throw new ApiError(400, 'AUTH_008', '새 비밀번호가 일치하지 않습니다.');
  if (input.currentPassword === input.newPassword) throw new ApiError(400, 'AUTH_028', '현재 비밀번호와 다른 비밀번호를 입력해 주세요.');
};
export const createHttpAccountSettingsRepository = (http: HttpClient): AccountSettingsRepository => ({
  changePassword: async input => { validatePasswordChange(input); await http.patch('/api/mypage/account/password', input); },
  pushSetting: async () => {
    const data = await http.get<PushSetting>('/api/mypage/notifications/settings');
    if (!data || typeof data.pushNotificationEnabled !== 'boolean') throw new ApiError(502, 'SETTINGS_RESPONSE_INVALID', '알림 설정을 확인하지 못했어요. 다시 시도해 주세요.');
    return data;
  },
  updatePushSetting: async enabled => {
    if (typeof enabled !== 'boolean') throw new ApiError(400, 'COMMON_002', '알림 설정을 확인해 주세요.');
    await http.patch('/api/mypage/notifications/settings', { pushNotificationEnabled: enabled });
  },
});
export const makeChangePassword = (repo: Pick<AccountSettingsRepository, 'changePassword'>, tokenStore: Pick<TokenStore, 'clear'>) => {
  let pending: Promise<void> | null = null;
  const run = async (input: PasswordChangeInput) => { validatePasswordChange(input); await repo.changePassword(input); await tokenStore.clear(); };
  return (input: PasswordChangeInput) => { pending ??= run(input).finally(() => { pending = null; }); return pending; };
};
