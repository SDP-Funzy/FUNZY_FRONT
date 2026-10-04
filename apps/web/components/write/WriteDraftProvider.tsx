'use client';

import { canAddHeartCard, createHeartCardDraft } from '@sdp/core';
import type { HeartCardDraft } from '@sdp/core';
import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type DraftState = {
  cards: HeartCardDraft[];
  currentIndex: number;
};

type DraftAction =
  | { type: 'reset'; id: string }
  | { type: 'updateCard'; index: number; changes: Partial<Omit<HeartCardDraft, 'id'>> }
  | { type: 'addCard'; id: string }
  | { type: 'goTo'; index: number };

const draftReducer = (state: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case 'reset':
      return { cards: [createHeartCardDraft(action.id)], currentIndex: 0 };
    case 'updateCard':
      return {
        ...state,
        cards: state.cards.map((card, i) => (i === action.index ? { ...card, ...action.changes } : card)),
      };
    case 'addCard': {
      if (!canAddHeartCard(state.cards.length)) return state;
      const newCard = createHeartCardDraft(action.id, state.cards[state.cards.length - 1]);
      return { cards: [...state.cards, newCard], currentIndex: state.cards.length };
    }
    case 'goTo':
      if (action.index < 0 || action.index >= state.cards.length) return state;
      return { ...state, currentIndex: action.index };
  }
};

/**
 * 카드에 고른 사진 (화면 미리보기용)
 * File 과 미리보기 주소는 브라우저 전용이라 core 의 카드 데이터와 따로 보관한다.
 * 서버 업로드 후 받은 imageKey 는 API 연동 이슈에서 카드 데이터에 넣는다.
 */
export type CardPhoto = {
  file: File;
  previewUrl: string;
};

export type WriteDraftContextValue = DraftState & {
  currentCard: HeartCardDraft;
  /** 카드 id → 사진 */
  photos: Record<string, CardPhoto>;
  setCurrentCardPhoto: (file: File) => void;
  /** 전송을 마친 뒤 작성 내용을 비운다 (뒤로 가기로 같은 편지를 다시 보내는 일 방지) */
  reset: () => void;
  updateCurrentCard: (changes: Partial<Omit<HeartCardDraft, 'id'>>) => void;
  addCard: () => void;
  goTo: (index: number) => void;
};

export const WriteDraftContext = createContext<WriteDraftContextValue | null>(null);

/**
 * 편지 작성 중인 내용 (마음카드 목록, 지금 보고 있는 카드)
 * /write 아래 화면들(마음카드, 선물카드 등)을 오가도 내용이 유지되도록 write layout 에 둔다.
 * 편지 쓰기 화면을 완전히 벗어나면 사라진다.
 */
export const WriteDraftProvider = ({ children }: { children: ReactNode }) => {
  // crypto.randomUUID 는 https 에서만 동작해서 간단한 번호로 카드 id 를 만든다
  const nextIdRef = useRef(1);
  const createId = () => `card-${nextIdRef.current++}`;

  const [state, dispatch] = useReducer(draftReducer, undefined, () => ({
    cards: [createHeartCardDraft('card-0')],
    currentIndex: 0,
  }));

  const updateCurrentCard = useCallback(
    (changes: Partial<Omit<HeartCardDraft, 'id'>>) => dispatch({ type: 'updateCard', index: state.currentIndex, changes }),
    [state.currentIndex],
  );
  const addCard = useCallback(() => dispatch({ type: 'addCard', id: createId() }), []);
  const goTo = useCallback((index: number) => dispatch({ type: 'goTo', index }), []);

  const [photos, setPhotos] = useState<Record<string, CardPhoto>>({});
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const currentCardId = state.cards[state.currentIndex]!.id;

  const setCurrentCardPhoto = useCallback(
    (file: File) => {
      // 미리보기 주소 생성·해제는 상태 업데이트 함수 밖에서 한다 (개발 모드에서 업데이트 함수가 두 번 실행될 수 있음)
      const previous = photosRef.current[currentCardId];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      setPhotos((prev) => ({ ...prev, [currentCardId]: { file, previewUrl } }));
    },
    [currentCardId],
  );

  const reset = useCallback(() => {
    Object.values(photosRef.current).forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos({});
    dispatch({ type: 'reset', id: createId() });
  }, []);

  // 편지 쓰기 화면을 떠날 때 남은 미리보기 주소 모두 해제
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      currentCard: state.cards[state.currentIndex]!,
      photos,
      setCurrentCardPhoto,
      reset,
      updateCurrentCard,
      addCard,
      goTo,
    }),
    [state, photos, setCurrentCardPhoto, reset, updateCurrentCard, addCard, goTo],
  );

  return <WriteDraftContext.Provider value={value}>{children}</WriteDraftContext.Provider>;
};
