/**
 * 마음카드 도메인 규칙
 * 화면(웹·앱)과 상관없이 지켜야 하는 규칙만 둔다.
 */

/** 카테고리 (백엔드 enum 과 같은 값, 순서는 피그마 선택 목록 순서) */
export const HEART_CARD_CATEGORIES = ['MUSIC', 'MOVIE_TV', 'PLACE', 'BOOK', 'FASHION', 'ETC'] as const;
export type HeartCardCategory = (typeof HEART_CARD_CATEGORIES)[number];

/**
 * 편지 한 통에 담을 수 있는 마음카드 수
 * 편지 작성 API에서 허용하는 최대 5장
 */
export const MAX_HEART_CARDS_PER_LETTER = 5;

/** 작성 중인 마음카드 (서버에 보내기 전 상태) */
export type HeartCardDraft = {
  id: string;
  category: HeartCardCategory;
  /**
   * '기타 직접입력' 을 골랐을 때 직접 적은 카테고리 이름
   * 기타 카테고리의 customCategory로 저장한다.
   */
  customCategory: string;
  to: string;
  content: string;
  from: string;
};

/**
 * 새 카드 만들기
 * To / From 은 같은 편지 안에서 대부분 같으므로 앞 카드 값을 이어받는다.
 */
export const createHeartCardDraft = (id: string, previous?: HeartCardDraft): HeartCardDraft => ({
  id,
  category: 'MUSIC',
  customCategory: '',
  to: previous?.to ?? '',
  content: '',
  from: previous?.from ?? '',
});

/** 본문이 채워진 카드인지 (본문은 필수) */
export const isHeartCardWritten = (card: HeartCardDraft) => card.content.trim().length > 0;

export const canAddHeartCard = (cardCount: number) => cardCount < MAX_HEART_CARDS_PER_LETTER;
