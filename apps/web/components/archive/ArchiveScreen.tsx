'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArchiveAddCardsForm, ArchiveCategoryForm } from '@/components/archive/ArchiveForms';
import { useArchivePreview } from '@/components/archive/ArchivePreviewProvider';
import { Header } from '@/components/ui/Header';
import type { ArchiveScope } from '@/lib/archivePreview';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';

type ArchiveScreenProps = { readOnly?: boolean; title?: string; baseHref?: string; profileHref?: string; avatarSrc?: string | null };
export const ArchiveScreen = ({ readOnly = false, title = '아카이브', baseHref = ROUTES.archive, profileHref = ROUTES.mypage, avatarSrc = '/images/letterbox/sample-avatar.jpg' }: ArchiveScreenProps = {}) => {
  const { categories, collections, letters, categoryId, setCategoryId, scope, setScope, zoom, setZoom, visibleEntries } = useArchivePreview();
  const [categoryForm, setCategoryForm] = useState(false);
  const [cardsForm, setCardsForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(360);
  const viewport = useRef<HTMLDivElement>(null);
  const categoryStrip = useRef<HTMLDivElement>(null);
  useEffect(() => { categoryStrip.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [categoryId]);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(entries => setViewportWidth(entries[0].contentRect.width));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const groups = collections.filter(collection => !categoryId || collection.categoryId === categoryId).flatMap(collection => {
    const cards = visibleEntries.filter(entry => entry.collectionId === collection.id && (!readOnly || entry.visibility === 'friends'));
    const category = categories.find(item => item.id === collection.categoryId)!;
    const cover = letters.find(letter => letter.id === cards[0]?.letterId);
    return cover ? [{ ...collection, cards, category, cover }] : [];
  });
  const worldWidth = Math.max(viewportWidth, 360) * zoom;
  const worldHeight = Math.max(820, groups.length * 130) * zoom;
  const size = 52 * zoom;
  const xPositions = [0.74, 0.12, 0.62, 0.4, 0.82, 0.2];
  const selected = groups.find(group => group.id === selectedId);
  const selectedIndex = groups.findIndex(group => group.id === selectedId);
  const leftFor = (index: number) => Math.min(worldWidth - size - 12, Math.max(12, worldWidth * xPositions[index % xPositions.length] - size / 2));
  const topFor = (index: number) => (90 + index * 118) * zoom;

  return <div className="flex h-[calc(100dvh_-_env(safe-area-inset-top,0px))] min-h-[480px] flex-col bg-[#fafaf1] md:h-full md:min-h-0">
    <Header title={title} className="shrink-0 bg-[#fafaf1]" paddingClassName="px-[20px]"
      left={<Link href={profileHref} aria-label={readOnly ? '친구 검색으로 돌아가기' : '내 프로필'} className="rounded-full focus-visible:outline-2 focus-visible:outline-orange">{avatarSrc ? <Image src={avatarSrc} alt="" width={40} height={40} className="size-[40px] rounded-full border-2 border-black object-cover" /> : <span aria-hidden="true" className="block size-[40px] rounded-full bg-gray-m-50" />}</Link>}
      right={!readOnly && <Link href={ROUTES.home} className="flex min-h-[44px] items-center px-[8px] text-14">홈</Link>} />
    <div className="flex shrink-0 items-center gap-[8px] px-[16px] pt-[12px]">
      {!readOnly && <button type="button" aria-label="카테고리 추가" onClick={() => setCategoryForm(true)} className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-black focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/plus.svg" alt="" width={20} height={20} className="brightness-0 invert" /></button>}
      <div ref={categoryStrip} role="group" aria-label="아카이브 카테고리" className="flex min-w-0 flex-1 gap-[8px] overflow-x-auto py-[4px] [scrollbar-width:none]">
        {categories.map(category => <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => { setCategoryId(categoryId === category.id ? null : category.id); setSelectedId(null); }}
          className={cn('flex min-h-[36px] shrink-0 items-center gap-[8px] rounded-full px-[10px] text-14 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange', categoryId && categoryId !== category.id ? 'bg-gray-m-300' : 'bg-black')}>
          <span aria-hidden="true" className="size-[22px] rounded-full" style={{ backgroundColor: category.color }} />{category.name}
        </button>)}
      </div>
    </div>
    {!readOnly && <div className="flex shrink-0 flex-wrap items-center justify-between gap-[8px] px-[20px] py-[12px] text-12 text-gray-m-500">
      <label className="flex items-center gap-[6px]">공개 범위<select aria-label="아카이브 공개 범위 필터" value={scope} onChange={event => { setScope(event.target.value as ArchiveScope); setSelectedId(null); }} className="min-h-[36px] rounded-control border border-gray-m-100 bg-white px-[6px] text-12 text-black"><option value="friends">친구 공개</option><option value="private">나만 보기</option><option value="all">전체</option></select></label>
      <button type="button" onClick={() => setCardsForm(true)} className="min-h-[36px] rounded-full bg-black px-[12px] text-white">카드 담기</button>
    </div>}
    <div className="relative min-h-0 flex-1">
      <div ref={viewport} role="region" aria-label="아카이브 격자 보드" tabIndex={0} onKeyDown={event => { if (event.key === 'Escape') setSelectedId(null); }}
        className="h-full overflow-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-orange" onClick={event => { if (event.target instanceof Element && !event.target.closest('[data-archive-node]')) setSelectedId(null); }}>
        <div className="relative min-h-full" style={{ width: worldWidth, height: worldHeight, backgroundImage: 'linear-gradient(to right,#e4e4db 1px,transparent 1px),linear-gradient(to bottom,#e4e4db 1px,transparent 1px)', backgroundSize: `${28 * zoom}px ${28 * zoom}px` }}>
          <p role="status" className="absolute top-[12px] left-[16px] rounded-full bg-white/80 px-[10px] py-[6px] text-12 text-gray-m-500">{groups.length}개 묶음{categoryId && ' · 카테고리를 다시 누르면 전체 보기'}</p>
          {groups.map((group, index) => <button key={group.id} type="button" data-archive-node aria-label={`${group.title}, ${group.cards.length}개 카드`} aria-expanded={selectedId === group.id} aria-controls={selectedId === group.id ? 'archive-group-preview' : undefined}
            onClick={() => setSelectedId(current => current === group.id ? null : group.id)} style={{ left: leftFor(index), top: topFor(index), width: size, height: size }}
            className="absolute rounded-[14px] shadow-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange motion-reduce:transition-none">
            <Image src={group.cover.image} alt="" fill sizes="90px" className="rounded-[14px] object-cover" />
            <span className="absolute -top-[10px] -right-[10px] flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full px-[4px] text-12 font-semibold text-black" style={{ backgroundColor: group.category.color }}>{group.cards.length}</span>
            {zoom > 1 && <Image src="/images/letterbox/sample-avatar.jpg" alt="" width={30} height={30} className="absolute -right-[14px] -bottom-[12px] size-[30px] rounded-full border-2 border-black object-cover" />}
          </button>)}
          {selected && <Link id="archive-group-preview" data-archive-node href={`${baseHref}/${selected.id}`} aria-label={`${selected.title} 카드 보기`}
            style={{ left: Math.max(12, Math.min(worldWidth - 248, leftFor(selectedIndex) - 90)), top: topFor(selectedIndex) + size + 18 }}
            className="absolute z-20 flex h-[150px] w-[232px] items-end gap-[10px] rounded-[24px] bg-black p-[10px] text-white shadow-lg after:absolute after:-bottom-[10px] after:right-[40px] after:border-x-[10px] after:border-t-[14px] after:border-x-transparent after:border-t-black focus-visible:outline-2 focus-visible:outline-orange">
            <Image src={selected.cover.image} alt="" width={120} height={128} className="h-[128px] w-[120px] shrink-0 rounded-[18px] object-cover" />
            <span className="min-w-0 pb-[8px]"><span className="block truncate text-14 font-medium" style={{ color: selected.category.color }}>{selected.title}</span><span className="mt-[8px] block text-12 text-gray-m-200">{selected.cards.length}개 카드<br />눌러서 보기</span></span>
            <Image src="/images/letterbox/sample-avatar.jpg" alt="" width={38} height={38} className="absolute -top-[14px] right-[8px] size-[38px] rounded-full border-2 border-black object-cover" />
          </Link>}
          {!groups.length && <div className="absolute top-[120px] right-[24px] left-[24px] rounded-funzy bg-white/90 px-[20px] py-[36px] text-center text-14 text-gray-m-500">
            <p>아직 표시할 카드가 없어요.</p>{!readOnly && <button type="button" onClick={() => setCardsForm(true)} className="mt-[16px] min-h-[44px] rounded-control bg-black px-[20px] text-white">카드 담기</button>}
          </div>}
        </div>
      </div>
      <div className="absolute right-[16px] bottom-[16px] flex items-center gap-[4px] rounded-full bg-white/95 p-[4px] text-12 shadow-md">
        <button type="button" disabled={zoom <= 0.75} onClick={() => setZoom(current => Math.max(0.75, current - 0.25))} className="min-h-[40px] rounded-full px-[10px] disabled:text-gray-m-200">축소</button>
        <span aria-label={`확대 비율 ${Math.round(zoom * 100)}퍼센트`}>{Math.round(zoom * 100)}%</span>
        <button type="button" disabled={zoom >= 1.5} onClick={() => setZoom(current => Math.min(1.5, current + 0.25))} className="min-h-[40px] rounded-full px-[10px] disabled:text-gray-m-200">확대</button>
      </div>
    </div>
    {!readOnly && categoryForm && <ArchiveCategoryForm onClose={() => setCategoryForm(false)} onCreated={id => { setCategoryId(id); setSelectedId(null); setCategoryForm(false); }} />}
    {!readOnly && cardsForm && <ArchiveAddCardsForm initialCategory={categoryId} onClose={() => setCardsForm(false)} onAdded={id => { setCategoryId(id); setScope('friends'); setCardsForm(false); setSelectedId(null); }} />}
  </div>;
};
