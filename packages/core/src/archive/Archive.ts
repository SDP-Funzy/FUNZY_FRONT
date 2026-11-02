import type { HeartCardCategory } from '../heartCard/domain/HeartCard';

export type ArchiveCard = { archiveCardId: number; letterCardId: number; category: HeartCardCategory; imageUrl: string | null; messagePreview: string; archivedAt: string };
export type ArchiveSection = { category: HeartCardCategory; displayName: string; thumbnailImageUrl: string | null; cards: ArchiveCard[]; empty: boolean };
export type ArchiveHome = { memberId: number; nickname: string; title: string; profileImageUrl: string | null; empty: boolean; sections: ArchiveSection[] };
export type ArchiveCardDetail = { archiveCardId: number; letterCardId: number; category: HeartCardCategory; senderName: string; receiverName: string; letterDate: string; imageUrl: string | null; message: string; locked: boolean; commentCount: number; archivedAt: string };
export type ArchiveComment = { commentId: number; parentCommentId: number | null; author: { memberId: number; nickname: string; profileImageUrl: string | null }; content: string; replyCount: number; mine: boolean; deletable: boolean; edited: boolean; createdAt: string };
export type ArchiveCommentPage = { comments: ArchiveComment[]; page: number; last: boolean; totalElements: number; totalPages: number };
export type ArchiveRepository = {
  home(): Promise<ArchiveHome>;
  friendHome(memberId: number): Promise<ArchiveHome>;
  detail(cardId: number): Promise<ArchiveCardDetail>;
  comments(cardId: number, page?: number): Promise<ArchiveCommentPage>;
  replies(cardId: number, commentId: number, page?: number): Promise<ArchiveCommentPage>;
  createComment(cardId: number, content: string, parentCommentId?: number): Promise<ArchiveComment>;
  updateComment(commentId: number, content: string): Promise<ArchiveComment>;
  deleteComment(commentId: number): Promise<void>;
};
