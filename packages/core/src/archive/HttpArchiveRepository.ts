import { HEART_CARD_CATEGORIES } from '../heartCard/domain/HeartCard';
import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { ArchiveCardDetail, ArchiveComment, ArchiveCommentPage, ArchiveHome, ArchiveRepository } from './Archive';

const invalid = () => new ApiError(502, 'ARCHIVE_RESPONSE_INVALID', '아카이브 응답을 확인하지 못했어요. 다시 시도해 주세요.');
export const archiveId = (id: number) => {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'COMMON_002', '카드 또는 댓글 번호를 확인해 주세요.');
  return id;
};
export const archiveCommentText = (value: string) => {
  const text = value.trim();
  if (!text || text.length > 200) throw new ApiError(400, 'COMMON_002', '댓글을 1~200자로 입력해 주세요.');
  return text;
};
const comment = (value: ArchiveComment) => {
  if (!value || !Number.isSafeInteger(value.commentId) || value.commentId <= 0 || typeof value.content !== 'string' || !value.author || typeof value.author.nickname !== 'string' || typeof value.mine !== 'boolean' || typeof value.deletable !== 'boolean') throw invalid();
  return value;
};
const pageResult = (value: ArchiveCommentPage) => {
  if (!value || !Array.isArray(value.comments) || typeof value.last !== 'boolean' || !Number.isInteger(value.page) || value.page < 0) throw invalid();
  return { ...value, comments: value.comments.map(comment) };
};
const pagination = (page: number) => {
  if (!Number.isInteger(page) || page < 0) throw new ApiError(400, 'COMMON_002', '페이지 번호를 확인해 주세요.');
  return { page, size: 20 };
};
export const createHttpArchiveRepository = (http: HttpClient): ArchiveRepository => ({
  home: async () => {
    const value = await http.get<ArchiveHome>('/api/archive/home');
    if (!value || !Array.isArray(value.sections) || typeof value.nickname !== 'string' || value.sections.some(section => !HEART_CARD_CATEGORIES.includes(section.category) || !Array.isArray(section.cards) || section.cards.some(card => !Number.isSafeInteger(card.archiveCardId) || card.archiveCardId <= 0 || !Number.isSafeInteger(card.letterCardId) || card.letterCardId <= 0))) throw invalid();
    return value;
  },
  detail: async id => {
    const value = await http.get<ArchiveCardDetail>(`/api/archive/cards/${archiveId(id)}`);
    if (!value || value.archiveCardId !== id || !Number.isSafeInteger(value.letterCardId) || value.letterCardId <= 0 || !HEART_CARD_CATEGORIES.includes(value.category) || typeof value.message !== 'string' || typeof value.locked !== 'boolean') throw invalid();
    return value;
  },
  comments: async (id, page = 0) => pageResult(await http.get(`/api/archive/cards/${archiveId(id)}/comments`, { query: pagination(page) })),
  replies: async (id, rootId, page = 0) => pageResult(await http.get(`/api/archive/cards/${archiveId(id)}/comments/${archiveId(rootId)}/replies`, { query: pagination(page) })),
  createComment: async (id, text, parentCommentId) => comment(await http.post(`/api/archive/cards/${archiveId(id)}/comments`, { content: archiveCommentText(text), ...(parentCommentId === undefined ? {} : { parentCommentId: archiveId(parentCommentId) }) })),
  updateComment: async (id, text) => comment(await http.patch(`/api/archive/comments/${archiveId(id)}`, { content: archiveCommentText(text) })),
  deleteComment: id => http.delete(`/api/archive/comments/${archiveId(id)}`),
});
