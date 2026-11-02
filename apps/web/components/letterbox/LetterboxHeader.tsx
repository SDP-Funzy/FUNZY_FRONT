import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';

export const LetterboxHeader = ({ sender = false, onSearch, expanded }: { sender?: boolean; onSearch: () => void; expanded: boolean }) => (
  <Header title={sender ? 'Funzy 보관함' : '편지 보관함'} className="bg-gray-pc-50" paddingClassName="px-[20px]"
    left={<Link href={sender ? ROUTES.letterbox : ROUTES.home} aria-label={sender ? '편지 보관함으로 돌아가기' : '홈으로 돌아가기'}
      className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
      <Image src="/icons/chevron-left.svg" alt="" width={14} height={21} />
    </Link>}
    right={<button type="button" onClick={onSearch} aria-label="보낸 사람 검색" aria-expanded={expanded}
      aria-controls="letterbox-search" className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
      <Image src="/icons/search.svg" alt="" width={30} height={30} />
    </button>} />
);
