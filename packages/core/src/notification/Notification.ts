export type NotificationItem = {
  id: number;
  /** 새 유형을 받아도 본문을 표시할 수 있도록 문자열로 둔다. */
  type: string;
  content: string;
  read: boolean;
  actorMemberId: number | null;
  letterId: number | null;
  archiveCardId: number | null;
  createdAt: string;
};

export interface NotificationRepository {
  list(): Promise<NotificationItem[]>;
  markRead(id: number): Promise<void>;
  unreadCount(): Promise<{ unreadCount: number }>;
}

export type NotificationTarget = { kind: 'letter' | 'archive' | 'friend'; id: number };

const isId = (id: number | null): id is number => id !== null && Number.isSafeInteger(id) && id > 0;
export const getNotificationTarget = (item: NotificationItem): NotificationTarget | null => {
  if (isId(item.letterId)) return { kind: 'letter', id: item.letterId };
  if (isId(item.archiveCardId)) return { kind: 'archive', id: item.archiveCardId };
  if ((item.type === 'FOLLOW_REQUEST' || item.type === 'FOLLOW_ACCEPTED') && isId(item.actorMemberId)) {
    return { kind: 'friend', id: item.actorMemberId };
  }
  return null;
};

export const getNotificationLabel = (type: string) => {
  const labels: Record<string, string> = {
    LETTER: '편지', GIFT_SELECTED: '두들픽', COMMENT: '친구', FOLLOW_REQUEST: '친구', FOLLOW_ACCEPTED: '친구',
  };
  return Object.prototype.hasOwnProperty.call(labels, type) ? labels[type]! : '알림';
};

export const formatNotificationTime = (createdAt: string, now: number) => {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return '시간 정보 없음';
  const elapsed = Math.max(0, now - created);
  if (elapsed < 60000) return '방금 전';
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}분 전`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}시간 전`;
  if (elapsed < 7 * 86400000) return `${Math.floor(elapsed / 86400000)}일 전`;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).format(created);
};
