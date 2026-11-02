import { createHttpFriendsRepository } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';
export const friendsRepository = createHttpFriendsRepository(apiClient);
