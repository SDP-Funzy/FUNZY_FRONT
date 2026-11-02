'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useArchiveApi } from '@/components/archive/ArchiveApiProvider';
import { ArchiveApiState } from '@/components/archive/ArchiveApiState';
import { Header } from '@/components/ui/Header';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { archiveCardHref } from '@/lib/archiveService';
import { letterImageUrl } from '@/lib/letterService';

export const ServerArchiveCollectionScreen = ({ category }: { category: string }) => {
  const resource = useArchiveApi();
  const section = resource.data?.sections.find(item => item.category === category);
  const cards = section?.cards ?? [];
  const { active, track, handlers } = useCardCarousel(cards.length);
  if (!resource.data) return <ArchiveApiState error={resource.error} retry={resource.reload} />;
  return <div className="flex flex-1 flex-col bg-cream pb-[32px]"><Header title={section?.displayName ?? '아카이브'} className="bg-cream" left={<Link href={resource.baseHref} aria-label="아카이브로 돌아가기" className="flex size-[44px] items-center justify-center"><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} /></Link>} />
    <p role="status" className="px-page pt-[12px] text-12 text-gray-m-400">{cards.length}개 카드</p>
    {!cards.length ? <div className="px-page py-[80px] text-center text-14"><p>{section ? '담은 카드가 없어요.' : '카테고리를 찾을 수 없어요.'}</p><Link href={resource.readOnly ? resource.baseHref : '/letterbox'} className="mt-[20px] inline-flex min-h-[44px] items-center underline">{resource.readOnly ? '친구 아카이브' : '편지 보관함'}</Link></div> : <div ref={track} {...handlers} role="region" aria-label="아카이브 카드 미리보기" tabIndex={0} className="mt-[38px] flex shrink-0 snap-x snap-mandatory gap-[16px] overflow-x-auto px-[32px] py-[4px] [scroll-padding-inline:32px] [scrollbar-width:none]">
      {cards.map((card, index) => { const photo = letterImageUrl(card.imageUrl); return <article key={card.archiveCardId} aria-label={`아카이브 카드 ${index + 1}`} aria-hidden={active !== index} inert={active !== index} className="relative aspect-[280/460] min-w-0 basis-full shrink-0 snap-center overflow-hidden rounded-[20px] bg-gray-m-100">
        {photo ? <Image src={photo} alt="" fill unoptimized sizes="(min-width: 768px) 340px, 85vw" className="object-cover" /> : <p className="p-[24px] text-16 leading-[1.8] break-words">{card.messagePreview}</p>}<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-x-[20px] bottom-[20px] flex items-end justify-between gap-[12px] text-white"><p className="text-12">{card.archivedAt?.slice(0, 10).replaceAll('-', '.')}</p><Link href={resource.readOnly ? `${resource.baseHref}/${section!.category}/${card.archiveCardId}` : archiveCardHref(card.archiveCardId)} className="flex min-h-[44px] items-center rounded-full bg-white px-[20px] text-14 font-semibold text-black">더보기 →</Link></div>
      </article>; })}
    </div>}
  </div>;
};
