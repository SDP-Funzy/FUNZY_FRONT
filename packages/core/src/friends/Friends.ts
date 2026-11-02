import { ApiError, isApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';

export type FollowStatus = 'NONE' | 'REQUESTED' | 'RECEIVED' | 'FRIEND' | 'SELF';
export type FriendMember = { memberId: number; nickname: string; profileImageUrl: string | null; followStatus: FollowStatus; followRequestId: number | null };
export type FriendsRepository = { search(nickname: string): Promise<FriendMember[]>; member(id: number): Promise<FriendMember>; request(id: number): Promise<void> };
export const normalizeFriendSearch = (value: string) => value.trim().replace(/^@/, '').toLowerCase();
const validId = (id: number) => {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'COMMON_002', '회원 번호를 확인해 주세요.');
  return id;
};
const memberResponse = (member: FriendMember): FriendMember => {
  if (!member || !Number.isSafeInteger(member.memberId) || member.memberId <= 0 || typeof member.nickname !== 'string' || !member.nickname || !['NONE', 'REQUESTED', 'RECEIVED', 'FRIEND', 'SELF'].includes(member.followStatus) || !(member.profileImageUrl === null || typeof member.profileImageUrl === 'string')) throw new ApiError(502, 'FRIEND_RESPONSE_INVALID', '회원 정보를 확인하지 못했어요. 다시 시도해 주세요.');
  return member;
};
export const createHttpFriendsRepository = (http: HttpClient): FriendsRepository => ({
  search: async value => {
    const nickname = normalizeFriendSearch(value);
    if (nickname.length < 2) throw new ApiError(400, 'SOCIAL_008', '아이디를 2자 이상 입력해 주세요.');
    const data = await http.get<FriendMember[]>('/api/social/members/search', { query: { nickname } });
    if (!Array.isArray(data)) throw new ApiError(502, 'FRIEND_RESPONSE_INVALID', '검색 결과를 확인하지 못했어요.');
    return data.map(memberResponse).filter(member => member.followStatus !== 'SELF').slice(0, 20);
  },
  member: async id => {
    const data = memberResponse(await http.get<FriendMember>(`/api/social/members/${validId(id)}`));
    if (data.memberId !== id) throw new ApiError(502, 'FRIEND_RESPONSE_INVALID', '회원 정보를 확인하지 못했어요.');
    return data;
  },
  request: id => http.post('/api/social/follow/requests', { memberId: validId(id) }),
});

/** 요청 성공 이후 조회만 실패했다면 다음 시도에서 요청을 다시 보내지 않는다. */
export const createFriendRequest = (repo: FriendsRepository, id: number, initialStatus: FollowStatus = 'NONE') => {
  let sent = ['REQUESTED', 'FRIEND', 'SELF'].includes(initialStatus); let uncertain = false; let pending: Promise<FriendMember> | null = null;
  const run = async () => {
    if (uncertain && !sent) {
      const member = await repo.member(id);
      if (['REQUESTED', 'FRIEND', 'SELF'].includes(member.followStatus)) { sent = true; return member; }
    }
    if (!sent) {
      try { await repo.request(id); sent = true; }
      catch (error) {
        if (isApiError(error) && ['SOCIAL_003', 'SOCIAL_004'].includes(error.code)) sent = true;
        else { uncertain = true; throw error; }
      }
    }
    return repo.member(id);
  };
  return { send: () => { pending ??= run().finally(() => { pending = null; }); return pending; } };
};
