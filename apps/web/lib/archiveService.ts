import { createHttpArchiveRepository } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';
export const archiveRepository = createHttpArchiveRepository(apiClient);
export const archiveCardHref = (id: number) => `/archive/cards/${id}`;
