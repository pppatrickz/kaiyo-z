// src/app/works/WorksPageClient.jsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useLang } from "@/app/_lib/langContext";
import SafeImage from "@/app/_components/ui/safeImage";
import PaintingPumaImages from "../../_components/deco/PaintingPumaImages";
import { getWorksImagePath } from "@/app/_lib/utils";

export default function WorksPageClient({ initialData }) {
  const { lang } = useLang();

  // 無限滾動
  const [visibleCount, setVisibleCount] = useState(9);
  const loadMoreRef = useRef(null);

  // 排序 & 篩選
  const [sortOrder, setSortOrder] = useState("newest"); 
  const [activeCategory, setActiveCategory] = useState("all");

  // 全部作品：資料來源改由傳進來的 initialData 提供
  const allWorks = useMemo(
    () =>
      (initialData?.works ?? []).map((work) => {
        let slug = String(work.id);
        return { ...work, slug };
      }),
    [initialData]
  );

  // 類別清單
  const categoryOptions = useMemo(
    () => ["all", ...Array.from(new Set(allWorks.map((w) => w.category)))],
    [allWorks]
  );

  // 篩選 + 排序
  const sorted = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? allWorks
        : allWorks.filter((w) => w.category === activeCategory);

    return [...filtered].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "newest" ? db - da : da - db;
    });
  }, [allWorks, activeCategory, sortOrder]);

  // 無限滾動觀察器
  useEffect(() => {
    if (visibleCount >= sorted.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((p) => Math.min(p + 6, sorted.length));
        }
      },
      { threshold: 1.0 }
    );

    const target = loadMoreRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [visibleCount, sorted.length]);

  useEffect(() => {
    setVisibleCount(9);
  }, [activeCategory, sortOrder]);

  // 🎯 精品式文字標籤控制鈕 (捨棄舊膠囊，改為當代藝廊底線設計)
  const FilterButton = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        shrink-0 py-2 text-xs md:text-sm tracking-[0.15em] uppercase transition-all duration-300 relative text-left font-light
        ${active ? "text-neutral-900 font-normal" : "text-neutral-400 hover:text-neutral-600"}
        snap-start
      `}
    >
      {children}
      {/* 底部優雅的小底線 */}
      <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-neutral-950 transition-transform duration-300 origin-left ${active ? "scale-x-100" : "scale-x-0"}`} />
    </button>
  );

  const Pill = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        shrink-0 h-10 px-5 flex items-center justify-center
        text-xs md:text-sm tracking-[0.15em] uppercase font-light
        rounded-full transition-all duration-300 snap-start select-none
        ${active 
          ? "bg-neutral-900 text-white shadow-sm font-normal border border-neutral-900" 
          : "bg-white text-neutral-500 border border-neutral-200 hover:text-neutral-900 hover:border-neutral-400 active:bg-neutral-50"
        }
      `}
    >
      {children}
    </button>
  );

  const t = (c) =>
    c === "all"
      ? (lang === "zh" ? "全部作品" : lang === "ja" ? "すべて" : "All Collection")
      : initialData?.categories?.[c]?.[lang] ?? c;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans antialiased selection:bg-neutral-200">
      
      {/* 獨立的大氣藝廊標題 */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 md:pt-24 md:pb-12 border-b border-neutral-200/60">
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.1em] text-neutral-900 uppercase">
          Works
          <span className="text-xs font-mono font-light text-neutral-300 ml-3 tracking-normal">
            ({sorted.length})
          </span>
        </h1>
      </div>

      {/* 控制列：分類標籤 + 排序標籤 */}
      <main className="max-w-6xl mx-auto px-6 py-6 pt-10 md:pt-0 md:py-10">
        
        <div className="mb-10 md:mb-16 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-neutral-100 pb-4">
          {/* 左側：分類導覽 */}
          <div className="relative w-full md:max-w-[75%]">
            <div
              className="flex flex-nowrap items-center gap-6 overflow-x-auto no-scrollbar snap-x pb-2 md:pb-0 md:flex-wrap md:overflow-visible"
              role="tablist"
              aria-label="Categories"
            >
              {categoryOptions.map((c) => (
                <FilterButton
                  key={c}
                  active={activeCategory === c}
                  onClick={() => setActiveCategory(c)}
                >
                  {t(c)}
                </FilterButton>
              ))}
            </div>
          </div>

          {/* 右側：排序選擇 */}
          <div className="flex items-center gap-4 border-l border-neutral-200 pl-0 md:pl-4">
            <button 
              onClick={() => setSortOrder("newest")}
              className={`text-[11px] tracking-widest uppercase font-mono transition-colors ${sortOrder === "newest" ? "text-neutral-900 font-bold" : "text-neutral-400 hover:text-neutral-600"}`}
            >
              {lang === "zh" ? "最新" : "Newest"}
            </button>
            <span className="text-neutral-300 text-xs">/</span>
            <button 
              onClick={() => setSortOrder("oldest")}
              className={`text-[11px] tracking-widest uppercase font-mono transition-colors ${sortOrder === "oldest" ? "text-neutral-900 font-bold" : "text-neutral-400 hover:text-neutral-600"}`}
            >
              {lang === "zh" ? "最舊" : "Oldest"}
            </button>
          </div>
        </div>

        {/* Masonry 作品網格：加入高質感的呼吸間距與文字資訊排印 */}
        <div className="columns-1 sm:columns-2 md:columns-3 gap-8 space-y-12 max-w-6xl mx-auto">
          {sorted.slice(0, visibleCount).map((work, i) => {
            const title = work.title?.[lang] ?? work.title?.en ?? work.slug;
            const year = work.date ? new Date(work.date).getFullYear() : (work.year ?? "");
            const material = work.material?.[lang] || work.material?.ja || work.material?.en || "";

            return (
              <Link
                key={work.slug}
                href={`/works/${work.category}/${work.slug}`}
                className="block w-full overflow-hidden break-inside-avoid group relative"
              >
                <div className="space-y-3 md:space-y-4">
                  {/* 裱框式圖片容器 (Museum Matting Style) */}
                  <div className="relative w-full bg-white border border-neutral-200/40 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-500 overflow-hidden">
                    <div className="overflow-hidden rounded-md bg-neutral-50">
                      <SafeImage
                        src={getWorksImagePath(work.category, work.images[0])}
                        alt={title}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover select-none transition-transform duration-700 ease-out group-hover:scale-103"
                      />
                    </div>
                  </div>

                  {/* 雜誌排版文字資訊：雙欄/非對稱 */}
                  <div className="flex justify-between items-start px-1 gap-4">
                    <div className="space-y-1 max-w-[75%]">
                      <h2 className="text-sm md:text-base font-light text-neutral-800 tracking-wide group-hover:text-black transition-colors line-clamp-1">
                        {title}
                      </h2>
                      {material && (
                        <p className="text-[11px] text-neutral-400 font-light line-clamp-1 tracking-wide">
                          {material}
                        </p>
                      )}
                    </div>
                    
                    {/* 右側：精緻的年份 */}
                    <div className="text-right font-mono text-[11px] tracking-widest text-neutral-400 font-light pt-0.5">
                      {year}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 無限滾動觸發點 */}
        {visibleCount < sorted.length && (
          <div ref={loadMoreRef} className="h-20 mt-16 flex justify-center items-center">
            <span className="text-xs font-mono tracking-[0.2em] text-neutral-400 uppercase animate-pulse">
              Loading more pieces...
            </span>
          </div>
        )}
        
        <div className="opacity-70 mt-16 md:mt-24">
          <PaintingPumaImages />
        </div>
      </main>
    </div>
  );
}