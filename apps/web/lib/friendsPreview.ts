export type PreviewFriendRelation = 'none' | 'sent' | 'friend';
export type PreviewFriend = { id: string; loginId: string; name: string; avatar: string | null; relation: PreviewFriendRelation };

export const createPreviewFriends = (): PreviewFriend[] => [
  { id: '1', loginId: 'FunFun', name: '주찌', avatar: '/images/letterbox/sample-avatar.jpg', relation: 'none' },
  { id: '2', loginId: 'FunFun_', name: '펀펀', avatar: null, relation: 'sent' },
  { id: '3', loginId: 'jju', name: '주찌', avatar: '/images/letterbox/sample-avatar.jpg', relation: 'friend' },
];

export const normalizeFriendQuery = (query: string) => query.trim().replace(/^@/, '').toLocaleLowerCase();
export const searchPreviewFriends = (members: PreviewFriend[], query: string) => {
  const prefix = normalizeFriendQuery(query);
  return prefix ? members.filter(member => member.loginId.toLocaleLowerCase().startsWith(prefix)).sort((a, b) => Number(b.relation === 'friend') - Number(a.relation === 'friend')).slice(0, 20) : [];
};
