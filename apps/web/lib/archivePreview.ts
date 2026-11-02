export type ArchiveVisibility = 'friends' | 'private';
export type ArchiveScope = ArchiveVisibility | 'all';
export type ArchiveCategory = { id: string; name: string; color: string };
export type ArchiveCollection = { id: string; categoryId: string; title: string };
export type ArchiveEntry = { id: string; collectionId: string; letterId: string; visibility: ArchiveVisibility; liked: boolean; likeCount: number };
export type ArchivePreviewState = { categories: ArchiveCategory[]; collections: ArchiveCollection[]; entries: ArchiveEntry[] };

export const ARCHIVE_COLORS = ['#ead3d7', '#d2e8f1', '#f0efb7', '#d1e9bd', '#e0c8ee', '#d9b37f'];
export const createArchivePreview = (): ArchivePreviewState => {
  const names = ['음악', '영화', '장소', '책', '패션', '기타'];
  const titles = ['memories', 'movie night', '여행의 조각', '책갈피', '나의 취향', '작은 일상'];
  const cardIds = [['1-3', '1-1', '1-2'], ['2-1', '2-2'], ['3-2', '3-3'], ['4-1'], ['5-1', '5-2'], ['6-1', '6-2', '6-3']];
  return {
    categories: names.map((name, index) => ({ id: `category-${index + 1}`, name, color: ARCHIVE_COLORS[index] })),
    collections: titles.map((title, index) => ({ id: `collection-${index + 1}`, title, categoryId: `category-${index + 1}` })),
    entries: cardIds.flatMap((ids, index) => ids.map((letterId, card) => ({ id: `entry-${index + 1}-${card + 1}`, collectionId: `collection-${index + 1}`, letterId,
      visibility: letterId === '1-2' ? 'private' as const : 'friends' as const, liked: false, likeCount: index + card }))),
  };
};
