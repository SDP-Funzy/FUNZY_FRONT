import type { GiftStroke } from '@/lib/giftDraft';

/** 사진과 별도인 투명 레이어. 지우개는 사진을 지우지 않는다. */
export const renderGiftStrokes = (canvas: HTMLCanvasElement, strokes: readonly GiftStroke[]) => {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#000000';
  context.fillStyle = '#000000';
  for (const stroke of strokes) {
    const first = stroke.points[0];
    if (!first) continue;
    context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    context.lineWidth = stroke.width * Math.min(canvas.width, canvas.height);
    context.beginPath();
    if (stroke.points.length === 1) {
      context.arc(first.x * canvas.width, first.y * canvas.height, context.lineWidth / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.moveTo(first.x * canvas.width, first.y * canvas.height);
      stroke.points.slice(1).forEach(point => context.lineTo(point.x * canvas.width, point.y * canvas.height));
      context.stroke();
    }
  }
  context.globalCompositeOperation = 'source-over';
};

export const giftCanvasHasInk = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) return false;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let alpha = 3; alpha < data.length; alpha += 4) if (data[alpha]! > 0) return true;
  return false;
};
