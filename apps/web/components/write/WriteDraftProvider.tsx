'use client';

import { canAddHeartCard, createHeartCardDraft } from '@sdp/core';
import type { HeartCardDraft } from '@sdp/core';
import { createContext, useCallback, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';

type DraftState = {
  cards: HeartCardDraft[];
  currentIndex: number;
};

type DraftAction =
  | { type: 'updateCard'; index: number; changes: Partial<Omit<HeartCardDraft, 'id'>> }
  | { type: 'addCard'; id: string }
  | { type: 'goTo'; index: number };

const draftReducer = (state: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
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

export type WriteDraftContextValue = DraftState & {
  currentCard: HeartCardDraft;
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

  const value = useMemo(
    () => ({
      ...state,
      currentCard: state.cards[state.currentIndex]!,
      updateCurrentCard,
      addCard,
      goTo,
    }),
    [state, updateCurrentCard, addCard, goTo],
  );

  return <WriteDraftContext.Provider value={value}>{children}</WriteDraftContext.Provider>;
};
