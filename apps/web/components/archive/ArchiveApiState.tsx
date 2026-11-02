'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { letterFailure } from '@/lib/letterService';
export const ArchiveApiState = ({ error, retry }: { error: unknown; retry: () => void }) => <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[60px] text-center">
  {error ? <><p role="alert" className="text-14 text-error">{letterFailure(error)}</p><Button fullWidth={false} onClick={retry} className="px-[24px]">다시 시도</Button></> : <p role="status" className="text-14 text-gray-m-500">아카이브를 불러오고 있어요.</p>}
  <Link href="/archive" className="min-h-[44px] text-14 underline">아카이브</Link><Link href="/home" className="min-h-[44px] text-14 underline">홈으로</Link>
</div>;
