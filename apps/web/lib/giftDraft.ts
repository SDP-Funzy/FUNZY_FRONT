export const MIN_GIFT_CARDS = 2;
export const MAX_GIFT_CARDS = 3;
export type GiftPoint = { x: number; y: number };
export type GiftTool = 'pen' | 'eraser';
export type GiftStroke = {
  tool: GiftTool;
  width: number;
  points: GiftPoint[];
  /** 이 획까지 그렸을 때 잉크가 남아 있는지. 지우개로 모두 지운 경우도 구분한다. */
  hasInk: boolean;
};
export type GiftCardDraft = { id: string; strokes: GiftStroke[] };
export type GiftDraftState = { cards: GiftCardDraft[]; index: number };
export type GiftDraftAction =
  | { type: 'add'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'select'; index: number }
  | { type: 'stroke'; id: string; stroke: GiftStroke }
  | { type: 'undo'; id: string }
  | { type: 'clear'; id: string }
  | { type: 'reset' };

export const createGiftDraft = (): GiftDraftState => ({
  cards: [{ id: 'gift-0', strokes: [] }, { id: 'gift-1', strokes: [] }], index: 0,
});

export const normalizeGiftPoint = (x: number, y: number, width: number, height: number): GiftPoint => ({
  x: Math.max(0, Math.min(1, width > 0 ? x / width : 0)),
  y: Math.max(0, Math.min(1, height > 0 ? y / height : 0)),
});

export const isGiftCardWritten = (card: GiftCardDraft, hasPhoto = false) =>
  hasPhoto || (card.strokes.at(-1)?.hasInk ?? false);

export const giftDraftReducer = (state: GiftDraftState, action: GiftDraftAction): GiftDraftState => {
  switch (action.type) {
    case 'reset': return createGiftDraft();
    case 'select': return action.index >= 0 && action.index < state.cards.length ? { ...state, index: action.index } : state;
    case 'add':
      if (state.cards.length >= MAX_GIFT_CARDS || state.cards.some(card => card.id === action.id)) return state;
      return { cards: [...state.cards, { id: action.id, strokes: [] }], index: state.cards.length };
    case 'remove': {
      if (state.cards.length <= MIN_GIFT_CARDS || !state.cards.some(card => card.id === action.id)) return state;
      const currentId = state.cards[state.index]!.id;
      const cards = state.cards.filter(card => card.id !== action.id);
      const retainedIndex = cards.findIndex(card => card.id === currentId);
      return { cards, index: retainedIndex >= 0 ? retainedIndex : Math.min(state.index, cards.length - 1) };
    }
    case 'stroke':
      if (!action.stroke.points.length) return state;
      return { ...state, cards: state.cards.map(card => card.id === action.id ? { ...card, strokes: [...card.strokes, action.stroke] } : card) };
    case 'undo':
      return { ...state, cards: state.cards.map(card => card.id === action.id ? { ...card, strokes: card.strokes.slice(0, -1) } : card) };
    case 'clear':
      return { ...state, cards: state.cards.map(card => card.id === action.id ? { ...card, strokes: [] } : card) };
  }
};
