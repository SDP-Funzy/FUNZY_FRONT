import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { NotificationRepository } from './Notification';

export const createHttpNotificationRepository = (http: HttpClient): NotificationRepository => ({
  list: () => http.get('/api/mypage/notifications'),
  unreadCount: () => http.get('/api/mypage/notifications/unread-count'),
  markRead: async (id) => {
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'COMMON_002', '알림을 확인할 수 없어요.');
    await http.patch(`/api/mypage/notifications/${id}/read`);
  },
});
