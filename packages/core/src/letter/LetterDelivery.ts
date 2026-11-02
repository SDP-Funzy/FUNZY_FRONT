import { HEART_CARD_CATEGORIES } from '../heartCard/domain/HeartCard';
import { ApiError, isApiError } from '../shared/http/ApiError';
import type { Letter, LetterCardInput, LetterDraftCard, LetterEnvelope, LetterImageUpload, LetterPhoto, LetterRepository, SentLetterReceipt } from './Letter';

const fail = (message: string) => new ApiError(400, 'LETTER_INPUT_INVALID', message);
export const validateLetterDraft = (cards: LetterDraftCard[]) => {
  if (cards.length < 1 || cards.length > 5) throw fail('마음카드는 1~5장으로 작성해 주세요.');
  const first = cards[0]!;
  const toName = first.to.trim(); const fromName = first.from.trim();
  if (!toName || !fromName || toName.length > 10 || fromName.length > 10) throw fail('받는 사람과 보내는 사람 이름을 각각 1~10자로 입력해 주세요.');
  for (const card of cards) {
    if (card.to.trim() !== toName || card.from.trim() !== fromName) throw fail('한 편지의 받는 사람과 보내는 사람 이름을 같게 맞춰 주세요.');
    if (!card.content.trim() || card.content.length > 500) throw fail('마음카드 본문을 각각 1~500자로 입력해 주세요.');
    if (!HEART_CARD_CATEGORIES.includes(card.category)) throw fail('카테고리를 확인해 주세요.');
    if (card.category === 'ETC' && (!card.customCategory.trim() || card.customCategory.trim().length > 10)) throw fail('기타 카테고리 이름을 1~10자로 입력해 주세요.');
    if (card.photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(card.photo.type) || card.photo.size > 5 * 1024 * 1024 || card.photo.size <= 0)) throw fail('사진은 5MB 이하의 JPG, PNG, WebP만 보낼 수 있어요.');
  }
  return { toName, fromName, designType: 'DesignType_A' } satisfies LetterEnvelope;
};

/** 재시도 시 저장된 편지를 다시 조회하고 동기화해서 카드 추가·완료를 중복 수행하지 않는다. */
export const createLetterDelivery = (repo: LetterRepository, upload: (target: LetterImageUpload, photo: LetterPhoto) => Promise<void>) => {
  let letterId: number | null = null;
  let receipt: SentLetterReceipt | null = null;
  let inFlight: Promise<SentLetterReceipt> | null = null;
  let creation: { before: Set<number>; envelope: LetterEnvelope } | null = null;
  const images = new Map<string, { body: unknown; target: LetterImageUpload }>();
  const run = async (cards: LetterDraftCard[]): Promise<SentLetterReceipt> => {
    const envelope = validateLetterDraft(cards);
    if (receipt) return receipt;
    if (letterId === null && creation) {
      const pending = creation;
      const matches = (await repo.drafts()).filter(draft => !pending.before.has(draft.letterId) && draft.toName === pending.envelope.toName && draft.fromName === pending.envelope.fromName && draft.cardCount === 0 && draft.status === 'DRAFT');
      if (matches.length !== 1) throw new ApiError(0, 'LETTER_CREATE_UNCERTAIN', '편지 생성 결과를 확인 중이에요. 중복 생성을 막기 위해 잠시 후 다시 시도해 주세요.');
      const recovered = await repo.get(matches[0]!.letterId);
      if (recovered.cards.length || recovered.designType !== pending.envelope.designType) throw fail('작성 중인 편지를 확인한 뒤 다시 시도해 주세요.');
      letterId = recovered.letterId;
    }
    if (letterId === null) {
      creation = { before: new Set((await repo.drafts()).map(item => item.letterId)), envelope };
      try { letterId = (await repo.create(envelope)).letterId; }
      catch (error) { if (isApiError(error) && error.status >= 400 && error.status < 500) creation = null; throw error; }
    }
    let letter = await repo.get(letterId);
    const inputs: LetterCardInput[] = [];
    for (const card of cards) {
      let imageKey: string | undefined;
      if (card.photo) {
        let cached = images.get(card.id);
        if (!cached || cached.body !== card.photo.body) {
          if (letter.status === 'SENT') throw fail('이미 전송된 편지의 사진은 바꿀 수 없어요. 새 편지를 작성해 주세요.');
          const target = await repo.presign(card.photo); await upload(target, card.photo);
          cached = { body: card.photo.body, target }; images.set(card.id, cached);
        }
        imageKey = cached.target.imageKey;
      }
      inputs.push({ category: card.category, content: card.content.trim(), ...(card.category === 'ETC' ? { customCategory: card.customCategory.trim() } : {}), ...(imageKey ? { imageKey } : {}) });
    }
    const sameCard = (server: Letter['cards'][number], input: LetterCardInput, index: number) => {
      const image = images.get(cards[index]!.id)?.target.imageUrl;
      const withoutQuery = (url: string) => url.split('?')[0];
      return server.category === input.category && server.content === input.content && (server.customCategory ?? '') === (input.customCategory ?? '') &&
        (input.imageKey ? !!server.imageUrl && !!image && withoutQuery(server.imageUrl) === withoutQuery(image) : !server.imageUrl);
    };
    if (letter.status === 'SENT') {
      if (letter.toName !== envelope.toName || letter.fromName !== envelope.fromName || letter.cards.length !== inputs.length || !letter.cards.every((card, index) => sameCard(card, inputs[index]!, index))) throw fail('이미 전송된 편지는 수정할 수 없어요. 새 편지를 작성해 주세요.');
    } else {
      if (letter.toName !== envelope.toName || letter.fromName !== envelope.fromName || letter.designType !== envelope.designType) letter = await repo.updateEnvelope(letterId, envelope);
      while (letter.cards.length > inputs.length) letter = await repo.removeCard(letterId, letter.cards[letter.cards.length - 1]!.cardId);
      for (let index = 0; index < inputs.length; index++) {
        const existing = letter.cards[index]; const input = inputs[index]!;
        if (!existing) letter = await repo.addCard(letterId, input);
        else if (!sameCard(existing, input, index)) letter = await repo.updateCard(letterId, existing.cardId, input);
      }
      if (letter.status !== 'COMPLETED') letter = await repo.complete(letterId);
    }
    const link = await repo.share(letterId);
    receipt = { ...link, letterId }; return receipt;
  };
  return {
    send: (cards: LetterDraftCard[]) => {
      if (inFlight) return inFlight;
      inFlight = run(cards).finally(() => { inFlight = null; }); return inFlight;
    },
  };
};
