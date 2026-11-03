import { createHttpAccountSettingsRepository, makeChangePassword } from '@sdp/core';
import { apiClient, tokenStore } from '@/lib/apiClient';
export const accountSettingsRepository = createHttpAccountSettingsRepository(apiClient);
export const changeAccountPassword = makeChangePassword(accountSettingsRepository, tokenStore);
