import type { HeartCardCategory } from '@sdp/core';

/** 카테고리 화면 표시 이름 (피그마 선택 목록 기준) */
export const CATEGORY_LABELS: Record<HeartCardCategory, string> = {
  MUSIC: '음악',
  MOVIE_TV: '영화/TV',
  PLACE: '장소',
  BOOK: '책',
  FASHION: '패션',
  ETC: '기타 직접입력',
};
