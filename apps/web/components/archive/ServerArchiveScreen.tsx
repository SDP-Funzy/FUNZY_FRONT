'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useArchiveApi } from '@/components/archive/ArchiveApiProvider';
import { ArchiveApiState } from '@/components/archive/ArchiveApiState';
import { Header } from '@/components/ui/Header';
import { ARCHIVE_COLORS } from '@/lib/archivePreview';
import { letterImageUrl } from '@/lib/letterService';
import { cn } from '@/lib/cn';

export const ServerArchiveScreen = () => {
  const resource = useArchiveApi();
  const { data, category, setCategory, zoom, setZoom } = resource;
  const [selected, setSelected] = useState<string | null>(null);
  const [width, setWidth] = useState(360);
  const viewport = useRef<HTMLDivElement>(null);
  const hasData = !!data;
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(viewport.current); return () => observer.disconnect();
  }, [hasData]);
  if (!data) return <ArchiveApiState error={resource.error} retry={resource.reload} />;
  const groups = data.sections.filter(section => section.cards.length && (!category || section.category === category));
  const worldWidth = Math.max(width, 360) * zoom;
  const size = 52 * zoom;
  const left = (index: number) => Math.max(12, Math.min(worldWidth - size - 12, worldWidth * [0.74, 0.12, 0.62, 0.4, 0.82, 0.2][index % 6] - size / 2));
  const top = (index: number) => (90 + index * 118) * zoom;
  const avatar = letterImageUrl(data.profileImageUrl);
  return <div className="flex h-[calc(100dvh_-_env(safe-area-inset-top,0px))] min-h-[480px] flex-col bg-[#fafaf1] md:h-full md:min-h-0">
    <Header title={resource.readOnly ? `${data.nickname}의 아카이브` : data.title || '아카이브'} className="shrink-0 bg-[#fafaf1]" paddingClassName="px-[20px]" left={<Link href={resource.readOnly ? '/friends' : '/mypage'} aria-label={resource.readOnly ? '친구 검색으로 돌아가기' : '내 프로필'} className="flex size-[44px] items-center justify-center">{avatar ? <Image src={avatar} alt="" width={40} height={40} unoptimized className="size-[40px] rounded-full border-2 border-black object-cover" /> : <span className="size-[40px] rounded-full bg-gray-m-100" />}</Link>} right={<Link href="/home" className="flex min-h-[44px] items-center px-[8px] text-14">홈</Link>} />
    <div role="group" aria-label="아카이브 카테고리" className="flex shrink-0 gap-[8px] overflow-x-auto px-[16px] py-[16px] [scrollbar-width:none]">{data.sections.map((section, index) => <button key={section.category} type="button" aria-pressed={category === section.category} onClick={() => { setCategory(category === section.category ? null : section.category); setSelected(null); }} className={cn('flex min-h-[36px] shrink-0 items-center gap-[8px] rounded-full px-[10px] text-14 text-white', category && category !== section.category ? 'bg-gray-m-300' : 'bg-black')}><span aria-hidden="true" className="size-[22px] rounded-full" style={{ backgroundColor: ARCHIVE_COLORS[index % ARCHIVE_COLORS.length] }} />{section.displayName}</button>)}</div>
    <div className="flex shrink-0 items-center justify-between gap-[12px] px-[20px] pb-[12px] text-12 text-gray-m-500"><p className="min-w-0 flex-1 truncate">{data.nickname}의 아카이브</p>{!resource.readOnly && <Link href="/letterbox" className="flex min-h-[36px] items-center rounded-full bg-black px-[12px] text-white">카드 담기</Link>}<button type="button" disabled={resource.loading} onClick={resource.reload} className="min-h-[36px] px-[8px] underline disabled:opacity-50">새로고침</button></div>
    {!!resource.error && <p role="alert" className="px-page pb-[12px] text-12 text-error">목록을 갱신하지 못했어요. 새로고침해 주세요.</p>}
    <div className="relative min-h-0 flex-1"><div ref={viewport} role="region" aria-label="아카이브 격자 보드" tabIndex={0} className="h-full overflow-auto overscroll-contain" onKeyDown={event => { if (event.key === 'Escape') setSelected(null); }}>
      <div className="relative min-h-full" style={{ width: worldWidth, height: Math.max(820, groups.length * 130) * zoom, backgroundImage: 'linear-gradient(to right,#e4e4db 1px,transparent 1px),linear-gradient(to bottom,#e4e4db 1px,transparent 1px)', backgroundSize: `${28 * zoom}px ${28 * zoom}px` }}>
        {groups.map((section, index) => {
          const photo = letterImageUrl(section.thumbnailImageUrl);
          return <div key={section.category}><button type="button" aria-label={`${section.displayName}, ${section.cards.length}개 카드`} aria-expanded={selected === section.category} onClick={() => setSelected(selected === section.category ? null : section.category)} style={{ left: left(index), top: top(index), width: size, height: size }} className="absolute rounded-[14px] bg-white shadow-md focus-visible:outline-2 focus-visible:outline-orange">
            {photo ? <Image src={photo} alt="" fill unoptimized sizes="90px" className="rounded-[14px] object-cover" /> : <span className="block truncate px-[6px] text-12">{section.displayName}</span>}
            <span className="absolute -top-[10px] -right-[10px] flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#e0c8ee] px-[4px] text-12">{section.cards.length}</span>
          </button>{selected === section.category && <Link href={`${resource.baseHref}/${section.category}`} aria-label={`${section.displayName} 카드 보기`} style={{ left: Math.max(12, Math.min(worldWidth - 248, left(index) - 90)), top: top(index) + size + 18 }} className="absolute z-20 flex h-[150px] w-[232px] items-end gap-[10px] rounded-[24px] bg-black p-[10px] text-white shadow-lg after:absolute after:-bottom-[10px] after:right-[40px] after:border-x-[10px] after:border-t-[14px] after:border-x-transparent after:border-t-black">
            <span className="relative flex h-[128px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white text-black">{photo ? <Image src={photo} alt="" fill unoptimized sizes="120px" className="object-cover" /> : <span className="line-clamp-5 p-[12px] text-12">{section.cards[0]?.messagePreview}</span>}</span><span className="min-w-0 pb-[8px]"><span className="block truncate text-14 text-[#e0c8ee]">{section.displayName}</span><span className="mt-[8px] block text-12">{section.cards.length}개 카드<br />눌러서 보기</span></span>
          </Link>}</div>;
        })}
        {!groups.length && <div className="absolute top-[120px] right-[24px] left-[24px] rounded-funzy bg-white/90 px-[20px] py-[36px] text-center text-14"><p>아직 표시할 카드가 없어요.</p>{!resource.readOnly && <Link href="/letterbox" className="mt-[16px] inline-flex min-h-[44px] items-center rounded-control bg-black px-[20px] text-white">보관함에서 카드 담기</Link>}</div>}
      </div>
    </div><div className="absolute right-[16px] bottom-[16px] flex items-center gap-[4px] rounded-full bg-white p-[4px] text-12 shadow-md"><button type="button" disabled={zoom <= .75} onClick={() => setZoom(Math.max(.75, zoom - .25))} className="min-h-[40px] px-[10px] disabled:opacity-30">축소</button><span>{Math.round(zoom * 100)}%</span><button type="button" disabled={zoom >= 1.5} onClick={() => setZoom(Math.min(1.5, zoom + .25))} className="min-h-[40px] px-[10px] disabled:opacity-30">확대</button></div></div>
  </div>;
};
