import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createGiftDraft, giftDraftReducer, isGiftCardWritten, normalizeGiftPoint } from '../lib/giftDraft';
import type { GiftStroke } from '../lib/giftDraft';
import { giftCanvasHasInk, renderGiftStrokes } from '../lib/giftDrawing';
import { MAX_GIFT_PHOTO_BYTES, prepareGiftPhoto } from '../lib/giftPhoto';

const pen: GiftStroke = { tool: 'pen', width: 0.008, points: [{ x: 0.1, y: 0.2 }, { x: 0.8, y: 0.9 }], hasInk: true };
const erase: GiftStroke = { tool: 'eraser', width: 0.075, points: [{ x: 0.5, y: 0.5 }], hasInk: false };

test('선물카드는 2장으로 시작하며 2장 아래로 삭제할 수 없다', () => {
  const state = createGiftDraft();
  assert.equal(state.cards.length, 2);
  assert.equal(state.index, 0);
  assert.equal(giftDraftReducer(state, { type: 'remove', id: 'gift-0' }), state);
});

test('3장까지 추가하고 중복 ID 및 범위 밖 선택을 무시한다', () => {
  const initial = createGiftDraft();
  assert.equal(giftDraftReducer(initial, { type: 'add', id: 'gift-0' }), initial);
  const added = giftDraftReducer(initial, { type: 'add', id: 'gift-2' });
  assert.equal(added.index, 2);
  assert.equal(giftDraftReducer(added, { type: 'add', id: 'gift-3' }), added);
  assert.equal(giftDraftReducer(added, { type: 'select', index: -1 }), added);
  assert.equal(giftDraftReducer(added, { type: 'select', index: 3 }), added);
});

test('그림과 되돌리기는 선택한 카드에만 적용한다', () => {
  const initial = createGiftDraft();
  const first = giftDraftReducer(initial, { type: 'stroke', id: 'gift-0', stroke: pen });
  const both = giftDraftReducer(first, { type: 'stroke', id: 'gift-1', stroke: pen });
  const undo = giftDraftReducer(both, { type: 'undo', id: 'gift-0' });
  assert.equal(undo.cards[0]!.strokes.length, 0);
  assert.equal(undo.cards[1]!.strokes.length, 1);
  assert.equal(initial.cards[0]!.strokes.length, 0);
  assert.equal(both.cards[0]!.strokes.length, 1);
});

test('지우개로 모두 지운 그림은 빈 카드이며 되돌리면 복원된다', () => {
  let state = giftDraftReducer(createGiftDraft(), { type: 'stroke', id: 'gift-0', stroke: pen });
  state = giftDraftReducer(state, { type: 'stroke', id: 'gift-0', stroke: erase });
  assert.equal(isGiftCardWritten(state.cards[0]!), false);
  assert.equal(isGiftCardWritten(state.cards[0]!, true), true);
  state = giftDraftReducer(state, { type: 'undo', id: 'gift-0' });
  assert.equal(isGiftCardWritten(state.cards[0]!), true);
  assert.equal(isGiftCardWritten(createGiftDraft().cards[0]!), false);
});

test('다른 카드를 삭제해도 선택한 카드 ID를 유지하고 마지막 카드 삭제도 안전하다', () => {
  const state = giftDraftReducer(createGiftDraft(), { type: 'add', id: 'gift-2' });
  const retained = giftDraftReducer(state, { type: 'remove', id: 'gift-0' });
  assert.equal(retained.cards[retained.index]!.id, 'gift-2');
  const removedCurrent = giftDraftReducer(state, { type: 'remove', id: 'gift-2' });
  assert.equal(removedCurrent.index, 1);
  assert.equal(removedCurrent.cards.length, 2);
});

test('초기화하면 모든 그림과 카드 선택을 초기 상태로 돌린다', () => {
  let state = giftDraftReducer(createGiftDraft(), { type: 'add', id: 'gift-2' });
  state = giftDraftReducer(state, { type: 'stroke', id: 'gift-2', stroke: pen });
  assert.deepEqual(giftDraftReducer(state, { type: 'reset' }), createGiftDraft());
});

test('화면 크기와 무관하게 좌표를 정규화하고 영역 밖을 제한한다', () => {
  assert.deepEqual(normalizeGiftPoint(50, 25, 100, 100), { x: 0.5, y: 0.25 });
  assert.deepEqual(normalizeGiftPoint(200, 100, 400, 400), { x: 0.5, y: 0.25 });
  assert.deepEqual(normalizeGiftPoint(-20, 200, 100, 100), { x: 0, y: 1 });
  assert.deepEqual(normalizeGiftPoint(10, 10, 0, 0), { x: 0, y: 0 });
});

test('캔버스는 펜과 지우개를 그린 순서대로 합성하고 한 점도 그린다', () => {
  const operations: string[] = [];
  const paths: number[][] = [];
  let composite = 'source-over';
  const context = {
    clearRect: () => operations.push('clear'),
    beginPath: () => {}, moveTo: (x: number, y: number) => paths.push([x, y]),
    lineTo: (x: number, y: number) => paths.push([x, y]),
    arc: () => operations.push('dot'), stroke: () => operations.push('stroke'), fill: () => operations.push('fill'),
    get globalCompositeOperation() { return composite; },
    set globalCompositeOperation(value: string) { composite = value; operations.push(value); },
  };
  const canvas = { width: 200, height: 200, getContext: () => context } as unknown as HTMLCanvasElement;
  renderGiftStrokes(canvas, [pen, erase]);
  assert.deepEqual(paths, [[20, 40], [160, 180]]);
  assert.deepEqual(operations, ['clear', 'source-over', 'stroke', 'destination-out', 'dot', 'fill', 'source-over']);
});

test('완전히 투명한 픽셀은 그림으로 세지 않고 잉크의 알파값을 확인한다', () => {
  const data = new Uint8ClampedArray([255, 255, 255, 0, 0, 0, 0, 0]);
  const canvas = { width: 2, height: 1, getContext: () => ({ getImageData: () => ({ data }) }) } as unknown as HTMLCanvasElement;
  assert.equal(giftCanvasHasInk(canvas), false);
  data[7] = 1;
  assert.equal(giftCanvasHasInk(canvas), true);
});

test('비사진·지원하지 않는 사진과 5MB 초과 파일은 URL을 만들기 전에 거부한다', async () => {
  await assert.rejects(prepareGiftPhoto(new File(['text'], 'text.txt', { type: 'text/plain' })), /사진/);
  await assert.rejects(prepareGiftPhoto(new File(['svg'], 'image.svg', { type: 'image/svg+xml' })), /사진/);
  await assert.rejects(prepareGiftPhoto(new File([new Uint8Array(MAX_GIFT_PHOTO_BYTES + 1)], 'large.png', { type: 'image/png' })), /5MB/);
});
