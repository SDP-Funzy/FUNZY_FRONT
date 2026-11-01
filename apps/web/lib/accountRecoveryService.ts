import { createHttpAccountRecoveryRepository, makeAccountRecovery } from '@sdp/core';

import { apiClient, tokenStore } from '@/lib/apiClient';

export const accountRecovery = makeAccountRecovery(createHttpAccountRecoveryRepository(apiClient), tokenStore);
