import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { letterFailure } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

export const LetterLoadState = ({ error, onRetry }: { error?: unknown; onRetry: () => void }) => <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px] text-center">
  {error ? <><p role="alert" className="text-14 text-error">{letterFailure(error)}</p><Button fullWidth={false} onClick={onRetry} className="px-[24px]">다시 시도</Button></> : <p role="status" className="text-14 text-gray-m-400">편지를 불러오고 있어요.</p>}
  <Link href={ROUTES.letterbox} className="flex min-h-[44px] items-center text-14 underline">보관함으로 돌아가기</Link>
</div>;
