import { createHttpReceivedCalendarRepository } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';

export const loadReceivedCalendar = createHttpReceivedCalendarRepository(apiClient).month;
